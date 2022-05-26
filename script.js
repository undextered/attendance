const file = document.getElementById('file')
const loader = document.getElementById("loader");
const take_attendance = document.getElementById("take_attendance");

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models')

]).then(start)

let globalnames = []
let globalconfidence = []
let date = ""

async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'

  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  let image
  let canvas
  Loading.innerText = "Models Loaded";
  loader.remove();
  //document.body.append('Loaded')
  file.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    var branch = document.getElementById("branch").value;
    var semester = document.getElementById("semester").value;
    
    image = await faceapi.bufferToImage(file.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors().withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      //faceapi.draw.drawDetections(canvas, resizedDetections);
      const minProbability = 0.5
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability) 
      const names = result.toString().replace(/[0-9(.)]/g, '');
      const confidence = result.toString().replace(/[^0-9\.]+/g, '');
      //console.log(names)
      globalnames.push(names)
      //console.log(confidence)
      globalconfidence.push(confidence)
      drawBox.draw(canvas)
      console.log(globalnames)
      console.log(globalconfidence)
      let funcdate = new Date().toLocaleString();
      date = branch + " " + semester + " " + funcdate + ".xlsx";
      
    })
  })
}

function loadLabeledImages() {
  //const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
  const labels = ['Aman', 'Kartik', 'Mohit', 'Priya', 'Shalini']
  //const labels = ['Adam', 'Cindy', 'Heather', 'Jake', 'Lucy', 'Michael']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 3; i++) {
        const img = await faceapi.fetchImage(`./labeled_images3/${label}/${i}.jpeg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}


        $("#take_attendance").click(function(){
          var wb = XLSX.utils.book_new();
          
          
          wb.SheetNames.push("Test Sheet");
          var present = []
          for (let i=0; i<globalnames.length;i++){
            present.push("PRESENT");
          }
          var ws_data = [globalnames,present];
          console.log(ws_data);
          var ws = XLSX.utils.aoa_to_sheet(ws_data);
          ws['!cols'] = fitToColumn(ws_data);

function fitToColumn(ws_data) {
    // get maximum character of each column
    return ws_data[0].map((a, i) => ({ wch: Math.max(...ws_data.map(a2 => a2[i] ? a2[i].toString().length : 0)) }));
}
          wb.Sheets["Test Sheet"] = ws;
  
          var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
          function s2ab(s) {
    
                  var buf = new ArrayBuffer(s.length);
                  var view = new Uint8Array(buf);
                  for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
                  return buf;
                  
          }
                saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), date);
        });