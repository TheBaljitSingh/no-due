import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import {fetchItem} from "./src/utils/service/todoService.js"
import { useEffect } from 'react';
import { useInView } from "react-intersection-observer";






export default function Main(){
    
    const queryClient = new QueryClient()

    return (

        <QueryClientProvider client={queryClient}>

        {/* <Learning/>     */}
        <Todo/>
        
        </QueryClientProvider>
    )
}



function Todo(){

    const { ref, inView } = useInView();

    const {
        data,
        error,
        status,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey:['items'],
        queryFn:fetchItem,
        initialPageParam:0,
        getNextPageParam:(lastResponse)=>lastResponse.nextPage,
    });

    useEffect(()=>{
        if(inView && hasNextPage){
            fetchNextPage();
        }
    },[fetchNextPage, inView, hasNextPage]);

    if(status === "pending") return <div>Loading...</div>;
    if(status === "error") return <div>{error?.message}</div>;

    return (
        <div className='flex flex-col gap-2 p-2 '>
            {data.pages.map((page)=>(
                <div key={page.currentPage} >
                    {page.data.map((item)=>(
                        <div key={item.id} className='rounded-md bg-gray-700 m-2 p-2 text-gray-200 w-1/2'>
                            {item.name}
                        </div>
                    ))}
                </div>
            ))}


            <div ref={ref}>
            {isFetchingNextPage && <div>Loading more...</div>}

            </div>
        </div>
    )
}