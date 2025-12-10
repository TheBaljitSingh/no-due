
import PageHeaders from '../../../utils/AfterAuthUtils/PageHeaders'
import LoadingSkeleton from '../../../utils/LoadingSkeleton'

const LoadingPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeaders
          header={'Reminder History'}
          subheader={'Track all your past reminders in one place'}
        />
        <div className='hidden md:block mt-6'>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))}
          </div>
        </div>
        <div className='md:hidden block mt-6'>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
  )
}

export default LoadingPage
