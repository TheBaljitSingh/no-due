
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders';
import CustomerCreation from '../../../Pages/AfterAuthPages/CustomerCreationPage';
const SingleEntryCreation = () => {
    

  return (
    <div className='min-w-0 w-full'>
      {/* Page Header */}
      <PageHeaders
        header="Create New Entry"
        subheader="Add customer dues and manage payment schedules"
      />

      {/* Main Content */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Customer Picker */}
    
        <CustomerCreation/>

        
      </div>
    </div>
  )
}

export default SingleEntryCreation