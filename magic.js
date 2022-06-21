
var url = '';
var source = '';
// Prepare canvas using PDF page dimensions
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var cur_state = 'START';

function getStatusLabelText(requestedStatus, aditionalText) {
  const statusTextStore = {
    START: 'START: Select a PDF file and click CRACK PDF',
    PROCESSING: 'PROCESSING: Password will show below once done.. ETA 5 mins...',
    SUCCESS: `SUCCESS: Password of the file is: ${aditionalText}`,
    FAILED: `FAILED: Password invalid when checked with ${aditionalText}.`
  };
  if (requestedStatus in statusTextStore) {
    if (cur_state.startsWith('SUCCESS')) {
      return;
    }
    cur_state = requestedStatus;
    document.getElementById('lbl_show_passwd').innerHTML = statusTextStore[requestedStatus];
  } else {
    document.getElementById('lbl_show_passwd').innerHTML = statusTextStore['START'];
  }
}

// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
const pdfjsLib = window['pdfjs-dist/build/pdf'];

// The workerSrc property creates new pdf.worker.js on every doc fetch
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

async function load_pdf_from_url(source, passwd) {
  // sanitize params
  if (!passwd || typeof passwd.valueOf() != "string" || passwd.length <= 0) {
    // ignore password since improperly formed
    passwd = '';
  }

  loadingTask = await pdfjsLib.getDocument({ data: source, password: passwd });
  loadingTask.promise
    .then(async function (pdf) {
      getStatusLabelText('SUCCESS', passwd);
      const page = await pdf.getPage(1); // page number 1
      // const tokenizedText = await page.getTextContent();
      var scale = 1.5;
      var viewport = page.getViewport({ scale: scale });
      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
      if (passwd) {
        document.getElementById('iframe-pdf').hidden = false;
      }
    })
    .catch(function (e) {
      loadingTask.destroy();
      // TODO: FIX loops larger than 500 which crash chrome tab
      // console.error(e);
      getStatusLabelText('FAILED', passwd);
    });
  await loadingTask;
}

async function execute_series(prefix, suffix, pwd_start_num, series_length, source) {
  // limit long loops on main thread to prevent page crash
  var series_limit = Math.min(100, series_length);
  for (let i = 0; i <= series_limit; i++) {
    var cur_pwd = `${prefix}${i + pwd_start_num}${suffix}`;
    if (cur_state.startsWith('SUCCESS')) {
      return;
    }
    await load_pdf_from_url(source, cur_pwd);
  }

  if (series_length <= series_limit) {
    // we have exhausted the total range
    return;
  }

  // kick off a delayed execution if series not exhausted!
  setTimeout(
    async () => {
      await execute_series(prefix, suffix, pwd_start_num + series_limit, series_length - series_limit, source);
    }, 5000);
}

async function execute() {
  let pdf_url = document.getElementById('source_pdf_file_path').value;
  if (pdf_url) {
    // fetch password parts
    const prefix = document.getElementById('txt_prefix').value;
    const suffix = document.getElementById('txt_suffix').value;
    var pwd_start_num = parseInt(document.getElementById('txt_start_num').value) || 0;
    var pwd_end_num = parseInt(document.getElementById('txt_end_num').value) || 0;
    // swap values if reversed range
    if (pwd_end_num < pwd_start_num) {
      temp = pwd_end_num;
      pwd_end_num = pwd_start_num;
      pwd_start_num = temp;
      // pwd_start_num, pwd_end_num = pwd_end_num, pwd_start_num; // works only in python lol
    }
    await execute_series(prefix, suffix, pwd_start_num, pwd_end_num - pwd_start_num, window.source);
  }
  else {
    getStatusLabelText('START');
    // pdf_url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
    // await load_pdf_from_url(pdf_url);
  }
  console.log('execute');
}
// document.getElementById('btn_crack_pdf').addEventListener("click", execute);
document.getElementById('btn_crack_pdf').onclick = async () => {
  await execute();
};

document.getElementById('source_pdf_file_path').addEventListener('change', function () {
  var reader = new FileReader();
  reader.onload = function () {
    var arrayBuffer = this.result;
    window.source = arrayBuffer;
    console.log('read file successfully');
  }
  reader.readAsArrayBuffer(this.files[0]);
  // reader.readAsArrayBuffer(new File(pdf_url));
});

console.log("magic.js executed");
// await execute();
