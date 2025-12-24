import React, { use, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import PaymentReminderTemplateCreationModel from "../../Components/AfterAuthComponent/PaymentReminder/PaymentReminderTemplateCreationModel";
import {createPaymentTerms, deletePaymentTerms, getUserPaymentTerms, updatePaymentTerms} from "../../utils/service/paymentTermService"
import { toast } from "react-toastify";
import {useAuth} from "../../context/AuthContext"

export default function PaymentReminder() {
  const [globalTerms, setGlobalTerms] = useState([]);
  const [customTerms, setCustomTerms] = useState([]);
  const {user} = useAuth();
  const [editingTerm, setEditingTerm] = useState();
  const [deletePaymentTerm,  setPaymentTerm] = useState();

  const [showTemplateCreationModal, setShowTemplateCreationModal] = useState(false);
  const templateCreationRef = useRef();


  useEffect(() => {


    async function fetchUserTemplate(){
      try {
        //api should be protected by auth middleware that only user can fetch thair template and default provided by nodue
        const res = await getUserPaymentTerms();
        let templates = res.data.paymentTerms;
  
      setGlobalTerms(templates.filter((t) => t.owner === null)); //have to verify
      setCustomTerms(templates.filter((t) => t.owner === user._id));
        

      } catch (error) {
        console.log(error);
      }
    }

    fetchUserTemplate();
   
  }, []);




useEffect(() => {
  function handleClickOutside(e) {
    if (
      templateCreationRef.current &&
      !templateCreationRef.current.contains(e.target)
    ) {
      setShowTemplateCreationModal(false);
      setEditingTerm(null);
    }
  }

  if (showTemplateCreationModal) {
    window.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    window.removeEventListener("mousedown", handleClickOutside);
  };
}, [showTemplateCreationModal]);






  const handleCreationSubmit = async (payload)=>{ // dout can i make it async?
    
    try {

      if(editingTerm){
        const res = await updatePaymentTerms(editingTerm._id, payload);

        setCustomTerms(prev =>
        prev.map(t =>
          t._id === editingTerm._id ? res.data.paymentTerm : t
        )
        
      );
      toast.success("Payment term updated");

      }else{

        const res = await createPaymentTerms(payload);
        
        //have to update the res
        setCustomTerms((prev)=>([
          ...prev,
          res.data.paymentTerm
        ]));
      toast.success("Payment term created");
      }

      setEditingTerm(null);
      setShowTemplateCreationModal(false);

    } catch (error) {
      console.log(error);
      toast.error("Operation failed");

    }

  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment term?")) return;

    try {
      await deletePaymentTerms(id);

      setCustomTerms(prev => prev.filter(t => t._id !== id));
      toast.success("Payment term deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (term) => {
  setEditingTerm(term);
  setShowTemplateCreationModal(true);
};



 

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-gray-800">
        Payment Terms
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global / Default Terms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Global / Default Terms
          </h3>

          <div className="space-y-3">
            {globalTerms.map((term) => (
              <div
                key={term._id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 hover:shadow-sm transition"
              >
                <div className="font-medium text-gray-800">
                  {term.name}
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  Credit Days: {term.creditDays}
                </div>

                <div className="text-sm text-gray-500">
                  Reminders: {term.reminderOffsets.join(", ")} days before
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Payment Terms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Custom Payment Terms
            </h3>

            <button
            onClick={()=>setShowTemplateCreationModal(true)}
              className="flex items-center gap-1 text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-900 transition"
            >
              <Plus size={16} />
              Add Custom Term
            </button>
          </div>

          {customTerms.length === 0 ? (
            <p className="text-sm text-gray-400">
              No custom payment terms created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {customTerms.map((term) => (
                <div
                  key={term._id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                    {term.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Reminders: {term.reminderOffsets.map((d,index)=>`${d}${  term.reminderOffsets.length-1==index?'':','}`)} days before
                  </div>
                  </div>
                <div className="flex gap-3 text-sm">
                <button
                  onClick={() => handleEdit(term)}
                  className="text-black hover:underline hover:text-blue-500"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(term._id)}
                  className="text-black hover:underline hover:text-red-500"
                >
                  Delete
                </button>
              </div>


                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      { showTemplateCreationModal &&
        <div ref={templateCreationRef}>
          <PaymentReminderTemplateCreationModel editingTerm={editingTerm}  handleClose={()=>{
            setShowTemplateCreationModal(false),
            setEditingTerm(null);
          }} handleSubmit={handleCreationSubmit} />

        </div>
      }
    </div>
  );
}
