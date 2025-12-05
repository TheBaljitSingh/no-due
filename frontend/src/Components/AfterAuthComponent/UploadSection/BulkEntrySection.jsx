import React, { useEffect, useRef, useState} from 'react'
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import PreviewCustomerModel from "./PreviewCustomerModel"

const BulkEntrySection = ({selectedFile , setSelectedFile}) => {

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({});
  const previewRef = useRef();


  useEffect(()=>{
    const handleMouseClick = (e)=>{
      if(!showPreview) return;

      if(previewRef!==undefined && previewRef.current.contains(e.target)){
        return;
      }

      setShowPreview(false);
    
    }
    document.addEventListener("mousedown", handleMouseClick);

    return ()=> document.removeEventListener("mousedown", handleMouseClick);
  });


 const csvTextToJson = (csvText) => {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.replace(/"/g, "").trim());
    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });

    return obj;
  });
};

const csvFileToJson = (file) => {
  const reader = new FileReader();

  reader.onload = function (event) {
    const csvText = event.target.result;
    const json = csvTextToJson(csvText);
    console.log("Converted JSON:", json);
    setPreviewData(json);
  };

  reader.readAsText(file);
};

  const handleSubmitEntry = ()=>{
    console.log("after preview sumit is clicked");
  }
  return (
    <div className='min-w-0 w-full'>
        <PageHeaders 
        header={'Upload Bulk Entries'} 
        subheader={'Import multiple customer records at once using CSV or Excel files'} 
        handleOnClick={() => console.log('clicked from upload section')} 
        buttonName={'Download Template'}
        />
      
        <div className="flex items-center justify-center w-full mt-6">
            <label 
              htmlFor="dropzone-file" 
              className="flex flex-col items-center justify-center w-1/2 h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors group"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-5 ">
                    
                    <div className="mb-4 p-3 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                      <UploadCloud className="w-8 h-8 text-green-600"/>
                    </div>

                    <p className="mb-2 text-sm text-gray-700">
                      <span className="font-semibold text-green-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV, XLS, or XLSX files only</p>
                    
                    {selectedFile && (
                        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">
                            <span className="font-medium text-green-600">{selectedFile.name}</span>
                          </span>
                        </div>
                    )}
                </div>
                <input 
                  id="dropzone-file" 
                  type="file" 
                  accept=".csv,.xls,.xlsx"
                  onChange={e =>{
                    setSelectedFile(e.target.files[0]);
                    csvFileToJson(e.target.files[0]);
                  }} 
                  className="hidden" 
                />
            </label>
        </div> 
        
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6">
          <button 
            onClick={() => setSelectedFile(null)}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            disabled={!selectedFile}
          >
            Clear File
          </button>
          <button 
            onClick={() => {
              if (!selectedFile) {
                alert('Please select a file first');
                return;
              }
              setShowPreview(true);
              
            }} 
            className="px-5 py-2.5 text-sm font-medium text-white component-button-green transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedFile}
          >
            Preview & Create Entries
          </button>
        </div>

      {showPreview && <div ref={previewRef}> 
        <PreviewCustomerModel data={previewData} setData={setPreviewData} handleClose={()=>setShowPreview(false)} handleSubmit={handleSubmitEntry} /> </div>}
      {/* i have to send the dummy data here */}

    </div>
  )
}

export default BulkEntrySection