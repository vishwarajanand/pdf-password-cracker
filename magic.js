
var url = '';
var source = '';
function getStatusLabelText(requestedStatus, aditionalText) {
  const statusTextStore = {
    START: 'Select a PDF file and click CRACK PDF',
    PROCESSING: 'Password will show below once done.. ETA 5 mins...',
    SUCCESS: `Password of the file is: ${aditionalText}`,
    FAILED: `Password invalid when checked with ${aditionalText}.`
  };
  if (requestedStatus in statusTextStore) {
    document.getElementById('lbl_show_passwd').innerHTML = statusTextStore[requestedStatus];
  } else {
    document.getElementById('lbl_show_passwd').innerHTML = statusTextStore['START'];
  }
}

async function load_pdf_from_url(source, passwd) {
  // sanitize params
  if (!passwd || typeof passwd.valueOf() != "string" || passwd.length <= 0) {
    // ignore password since improperly formed
    passwd = '';
  }

  try {
    // If absolute URL from the remote server is provided, configure the CORS
    // header on that server.
    const pdfjsLib = window['pdfjs-dist/build/pdf'];

    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/pdf.worker.js';

    const pdf = await pdfjsLib.getDocument({ data: source, passwd }).promise;
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
      return true;
    }
  } catch (e) {
    console.error(e);
    getStatusLabelText('PROCESSING');
    return false;
  }
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

    for (let i = pwd_start_num; i <= pwd_end_num; i++) {
      var cur_pwd = `${prefix}${i}${suffix}`;
      const attempt = await load_pdf_from_url(window.source, cur_pwd);
      if (!attempt) {
        getStatusLabelText('FAILED', cur_pwd);
      } else {
        getStatusLabelText('SUCCESS', cur_pwd);
        break;
      }
    }
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
