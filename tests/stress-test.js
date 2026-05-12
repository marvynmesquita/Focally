import puppeteer from 'puppeteer';

// Configurações do Teste de Carga
const TARGET_URL = 'https://focally.vercel.app';
const SESSION_CODE = process.argv[2]; // Pega o código da sessão via linha de comando
const MAX_DEVICES = parseInt(process.argv[3]) || 50; // Quantidade de alunos virtuais
const BATCH_SIZE = 5; // Quantos alunos conectam simultaneamente
const DELAY_BETWEEN_BATCHES = 2000; // Tempo de espera entre os lotes (ms)

if (!SESSION_CODE) {
  console.error('❌ Erro: Você precisa fornecer o código da sessão.');
  console.log('Uso: node tests/stress-test.js <CODIGO_DA_SESSAO> [NUMERO_DE_DISPOSITIVOS]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function simulateStudent(id, code) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-fake-ui-for-media-stream',
        '--disable-gpu',
        '--mute-audio' // Previne eco de múltiplos navegadores abertos
      ]
    });

    const page = await browser.newPage();
    
    // Intercepta e bloqueia recursos desnecessários para economizar CPU
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`[Aluno ${id}] ⏳ Acessando ${TARGET_URL}...`);
    await page.goto(`${TARGET_URL}/?mode=aluno&code=${code}`, { waitUntil: 'networkidle2' });

    console.log(`[Aluno ${id}] 🔌 Tentando conectar na sessão ${code}...`);
    
    // Aguarda o botão de conectar estar visível (assumindo que o código já está preenchido via URL)
    // Se o app requer clique no botão, vamos procurar por um botão que contenha "Conectar" ou similar
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Procura e clica no botão conectar
    const buttons = await page.$$('button');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.toLowerCase().includes('conectar') || text.toLowerCase().includes('entrar')) {
        await btn.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.log(`[Aluno ${id}] ⚠️ Botão de conectar não encontrado. Verifique a UI.`);
    }

    // Monitora a página para verificar se ocorreu erro ou se conectou
    // Aqui assumimos que ele fica na página esperando a conexão. O WebRTC vai operar em background.
    console.log(`[Aluno ${id}] ✅ Em sessão. Aguardando falha ou limite...`);

    // Mantém o browser aberto para manter a conexão WebRTC
    return browser;
  } catch (err) {
    console.error(`[Aluno ${id}] ❌ Falhou:`, err.message);
    if (browser) await browser.close();
    return null;
  }
}

async function runStressTest() {
  console.log(`🚀 Iniciando teste de carga ("Stack Overflow") no Focally`);
  console.log(`📡 Alvo: ${TARGET_URL}`);
  console.log(`🔑 Sessão: ${SESSION_CODE}`);
  console.log(`👥 Máximo de alunos: ${MAX_DEVICES}`);
  console.log(`------------------------------------------------------`);

  const activeBrowsers = [];

  for (let i = 0; i < MAX_DEVICES; i += BATCH_SIZE) {
    const batchPromises = [];
    const currentBatchSize = Math.min(BATCH_SIZE, MAX_DEVICES - i);
    
    console.log(`\n⏳ Lançando lote de ${currentBatchSize} alunos virtuais (Total: ${i + currentBatchSize}/${MAX_DEVICES})...`);
    
    for (let j = 0; j < currentBatchSize; j++) {
      batchPromises.push(simulateStudent(i + j + 1, SESSION_CODE));
    }

    const browsers = await Promise.all(batchPromises);
    activeBrowsers.push(...browsers.filter(b => b !== null));

    console.log(`✅ Lote concluído. Alunos conectados até o momento: ${activeBrowsers.length}`);
    
    if (i + BATCH_SIZE < MAX_DEVICES) {
      console.log(`💤 Aguardando ${DELAY_BETWEEN_BATCHES}ms para o próximo lote para não sobrecarregar sua CPU local...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  console.log(`\n🎉 Teste de carga finalizado!`);
  console.log(`Dispositivos virtuais mantidos abertos: ${activeBrowsers.length}`);
  console.log(`\n👉 Monitore o dispositivo do PROFESSOR. Veja se a aba travou ou o áudio parou de funcionar.`);
  console.log(`Pressione Ctrl+C para encerrar e fechar todas as instâncias.`);
  
  process.on('SIGINT', async () => {
    console.log('\nEncerrando e fechando navegadores...');
    for (const b of activeBrowsers) {
      await b.close();
    }
    process.exit();
  });
}

runStressTest();
