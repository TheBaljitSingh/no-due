import React from 'react'

const MobileOpenButton = ({setOpen , open}) => {
  return (
    <div >
      <div  className='w-full bg-red-400 z-[45] relative' >

       <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute  inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg
        sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200
        dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
        >
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
            />
        </svg>
      </button>
            </div>

       {/* Overlay when open on mobile */}
       {open && (
        <button
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          aria-label="Close sidebar overlay"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}

export default MobileOpenButton
