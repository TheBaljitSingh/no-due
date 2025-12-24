import React, { useEffect, useRef, useState} from 'react'
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import PreviewCustomerModel from "./PreviewCustomerModel"
import { createCustomers } from '../../../utils/service/customerService'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'



const BulkEntrySection = ({paymentTerms}) => {

  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState({});
  const previewRef = useRef();
  const naviage = useNavigate();
  const [continueFile, setContinueFile] = useState(false);

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
    setPreviewData(json);
  };

  reader.readAsText(file);
};

  const handleSubmitEntry = async()=>{

    try {
      const response = await createCustomers(previewData); 
      if(response.success){
      toast.success(response?.message);
      setTimeout(()=>{
        setShowPreview(false);
        setSelectedFile(null);
        naviage("/nodue/customer-master");
      },2000)
    }
      
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message ||"Failed to create bulk entries");
      
    }

  }
  const handleDownloadCSVFormat = async()=>{
    const link = document.createElement('a');
    link.href = '../../../../public/Template.csv'; 
    link.download="CSVFormat-nodue.csv";
    link.click();
  }
  return (
    <div className='min-w-0 w-full'>
        <PageHeaders 
        header={'Upload Bulk Entries'} 
        subheader={'Import multiple customer records at once using CSV or Excel files'} 
        handleOnClick={handleDownloadCSVFormat} 
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
        <PreviewCustomerModel data={previewData} setData={setPreviewData} handleClose={()=>setShowPreview(false)} setContinueFile={setContinueFile} /> </div>}
      
     {continueFile && (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm py-12">
    <div className="w-[92%] max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden animate-fadeIn">

      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Confirm Payment Terms
          </h2>
          <p className="text-sm text-gray-500">
            Select a payment term to apply to all uploaded entries
          </p>
        </div>

        <button
          onClick={() => setContinueFile(false)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Payment Term
        </label>

        <select
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          defaultValue=""
          onChange={(e) => {
            const updatedData = previewData.map(item => ({
              ...item,
              paymentTerm: e.target.value
            }));
            setPreviewData(updatedData);
          }}
        >
          <option value="" disabled>
            Select Payment Term
          </option>
          {paymentTerms.map(term => (
            <option key={term._id} value={term._id}>
              {term.name} — {term.creditDays} days
            </option>
          ))}
        </select>

        <p className="text-xs text-gray-500">
          This payment term will be applied to all selected customers.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
        <button
          onClick={() => setContinueFile(false)}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmitEntry}
          className="px-6 py-2 text-sm font-medium text-white rounded-lg component-button-green shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Submit Entries
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}

export default BulkEntrySection