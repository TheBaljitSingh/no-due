import { useEffect, useState } from "react";
import { getAllcustomers } from "../utils/service/customerService";

export function useCustomers(){
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=>{
        //mounting thing
        let isMounted = true;

        async function fetchCustomers(){
            try {
                setLoading(true);
                const response = await getAllcustomers();
                if(isMounted){
                    setCustomers(response?.data?.customers || []);
                }                
            } catch (error) {
                if(isMounted){
                    setError(error);
                }
            }finally{
                if(isMounted){
                    setLoading(false);
                }

            }
        }
        fetchCustomers();
        
        return ()=>{
            isMounted = false;
        }
    },[]);

    return {customers, setCustomers, loading, error};

}