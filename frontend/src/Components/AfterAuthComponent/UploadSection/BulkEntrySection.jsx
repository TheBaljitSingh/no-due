import React from 'react'
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import logger from "../../../utils/logger/js"

const BulkEntrySection = ({selectedFile , setSelectedFile}) => {
  return (
    <div className='min-w-0 w-full'>
        <PageHeaders 
        header={'Upload Bulk Entries'} 
        subheader={'Import multiple customer records at once using CSV or Excel files'} 
        handleOnClick={() => logger.log('clicked from upload section')} 
        buttonName={'Download Template'}
        />
      
        <div className="flex items-center justify-center md:w-6xl w-full mt-6">
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
                  onChange={(e) => setSelectedFile(e.target.files[0])} 
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
              alert('Bulk entries created successfully!');
              setSelectedFile(null);
            }} 
            className="px-5 py-2.5 text-sm font-medium text-white component-button-green transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedFile}
          >
            Upload & Create Entries
          </button>
        </div>
    </div>
  )
}

export default BulkEntrySection