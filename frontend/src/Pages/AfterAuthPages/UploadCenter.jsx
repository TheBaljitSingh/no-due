import React, { useState } from 'react'
import { ArrowDownUp, ArrowUpDown, Loader2} from 'lucide-react'
import BulkEntrySection from '../../Components/AfterAuthComponent/UploadSection/BulkEntrySection';
import { useEffect } from 'react';
import { getUserPaymentTerms } from '../../utils/service/paymentTermService';
import CustomerCreationPage from './CustomerCreationPage';

const UploadCenter = () => {
  const [loading, setLoading] = useState();
  const [inverted , setInverted] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState([]);

  useEffect(() => {
    async function fetchUserTemplate(){
      try {
        //api should be protected by auth middleware that only user can fetch thair template and default provided by nodue
          const res = await getUserPaymentTerms();
            let templates = res.data.paymentTerms;
          setPaymentTerms(templates);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserTemplate();
  },[]);
console.log("paymentTerms in upload center",paymentTerms);


if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            </div>
        );
    }

  return (
  <div className="max-w-7xl mx-auto md:px-4 px-6 lg:px-8 py-6">
    {
      inverted ? (
        <CustomerCreationPage paymentTerms={paymentTerms}/>
      ) : (
        <BulkEntrySection  paymentTerms={paymentTerms} />
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
        <BulkEntrySection  paymentTerms={paymentTerms} />
      ) : (
        <CustomerCreationPage paymentTerms={paymentTerms} />
      )
    }
    
  </div>
  )
} 

export default UploadCenter