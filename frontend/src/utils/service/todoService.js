const items = Array.from({length:100}).map((_, i)=>({
    id:i,
    name: `Item ${i}`,
}))


const limit = 10;
export function fetchItem({pageParam}){
    console.log("params tt",pageParam);
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve({data:items.slice(pageParam, pageParam + limit), 
            currentPage:pageParam,
            nextPage:pageParam+limit <items.length ?pageParam + limit: null
            })
        },100);
    })
}
