import React, { useState } from 'react'
import { ArrowDownUp, ArrowUpDown} from 'lucide-react'
import { CustomerNames } from '../../utils/constants';
import BulkEntrySection from '../../Components/AfterAuthComponent/UploadSection/BulkEntrySection';
import SingleEntryCreation from '../../Components/AfterAuthComponent/UploadSection/SingleEntryCreation';
import logger from '../../utils/logger.js';

const UploadCenter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCustomer , setSelectedCustomer] = useState(null);
  const [inverted , setInverted] = useState(false);


  logger.log(CustomerNames)
  return (
  <div className="max-w-7xl mx-auto md:px-4 px-6 lg:px-8 py-6">
    {
      inverted ? (
        <SingleEntryCreation selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}/>
      ) : (
        <BulkEntrySection selectedFile={selectedFile} setSelectedFile={setSelectedFile}/>
      )
    }

      <div className='my-10 flex justify-center items-center gap-6'>
          <div className='h-px flex-1 bg-gray-200 max-w-xs'></div>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-gray-500 uppercase tracking-wide'>Or</span>
            <button 
              onClick={() => setInverted(prev => !prev)} 
              className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              aria-label="Switch upload mode"
            >
              {inverted ? <ArrowDownUp className="w-4 h-4"/> : <ArrowUpDown className="w-4 h-4"/>}
            </button>
          </div>
          <div className='h-px flex-1 bg-gray-200 max-w-xs'></div>
      </div>

    {
      inverted ? (
        <BulkEntrySection selectedFile={selectedFile} setSelectedFile={setSelectedFile}/>
      ) : (
        <SingleEntryCreation selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}/>
      )
    }
    
  </div>
  )
} 

export default UploadCenter