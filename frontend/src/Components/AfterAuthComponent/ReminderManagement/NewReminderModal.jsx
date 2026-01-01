import React, { useMemo, useState } from 'react'
import { MessageCircle, Phone, Send, BellRing, X } from "lucide-react";
import { TEMPLATES } from '../../../utils/constants';

const NewReminderModal = ({ onClose }) => {
    const [channels, setChannels] = useState(["whatsapp"]);
    const [template, setTemplate] = useState("gentle_due_1");
    const [datetime, setDatetime] = useState("");
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [link, setLink] = useState("https://pay.nodue.in/txn/123");
  
    const tpl = TEMPLATES[template];
    const body = useMemo(() => {
      const map = {
        name: name || "Customer",
        amount: amount || "—",
        due_date: dueDate || "—",
        payment_link: link || "—",
      };

      return (tpl?.body || "").replace(/\{\{(.*?)\}\}/g, (_, k) => map[k.trim()] ?? "");
    }, [tpl, name, amount, dueDate, link]);
  
    const toggle = (c) => setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
    const canSubmit = channels.length > 0 && template && datetime;
  
    return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-blue-600"/>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create New Reminder</h3>
                <p className="text-xs text-gray-500 mt-0.5">Schedule automated payment reminders</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Left Column - Form */}
              <div className="space-y-5">
                
                {/* Channels */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Communication Channels</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`relative flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      channels.includes("whatsapp") 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={channels.includes("whatsapp")} 
                        onChange={() => toggle("whatsapp")} 
                      />
                      <MessageCircle className={`w-5 h-5 ${channels.includes("whatsapp") ? "text-green-600" : "text-gray-400"}`}/>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${channels.includes("whatsapp") ? "text-green-900" : "text-gray-700"}`}>
                          WhatsApp
                        </div>
                        <div className="text-xs text-gray-500">Instant message</div>
                      </div>
                      {channels.includes("whatsapp") && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </label>

                    <label className={`relative flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      channels.includes("voice") 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={channels.includes("voice")} 
                        onChange={() => toggle("voice")} 
                      />
                      <Phone className={`w-5 h-5 ${channels.includes("voice") ? "text-blue-600" : "text-gray-400"}`}/>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${channels.includes("voice") ? "text-blue-900" : "text-gray-700"}`}>
                          Voice Call
                        </div>
                        <div className="text-xs text-gray-500">Automated call</div>
                      </div>
                      {channels.includes("voice") && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Template */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Message Template</label>
                  <select 
                    value={template} 
                    onChange={(e) => setTemplate(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {Object.entries(TEMPLATES).map(([key, t]) => (
                      <option key={key} value={key}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Schedule DateTime */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Schedule Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={datetime} 
                    onChange={(e) => setDatetime(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Customer Name</label>
                      <input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                        placeholder="Enter customer name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Due Amount (₹)</label>
                        <input 
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                          placeholder="75000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Due Date</label>
                        <input 
                          type="date" 
                          value={dueDate} 
                          onChange={(e) => setDueDate(e.target.value)} 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Link</label>
                      <input 
                        value={link} 
                        onChange={(e) => setLink(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Message Preview</label>
                <div className="space-y-4">
                  {channels.includes("whatsapp") && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gradient-to-br from-green-50 to-white">
                      <div className="px-4 py-3 bg-green-600 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-white"/>
                        <span className="text-xs font-semibold text-white uppercase tracking-wide">WhatsApp Message</span>
                      </div>
                      <div className="p-4">
                        <div className="bg-white rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap shadow-sm border border-gray-200 leading-relaxed">
                          {body || "Message preview will appear here..."}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {channels.includes("voice") && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gradient-to-br from-blue-50 to-white">
                      <div className="px-4 py-3 bg-blue-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-white"/>
                        <span className="text-xs font-semibold text-white uppercase tracking-wide">Voice Call Script</span>
                      </div>
                      <div className="p-4">
                        <div className="bg-white rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap shadow-sm border border-gray-200 leading-relaxed">
                          {body || "Voice script will appear here..."}
                        </div>
                      </div>
                    </div>
                  )}

                  {channels.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                      <div className="text-gray-400 text-sm">Select a channel to see preview</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
            <div className="text-xs text-gray-500">
              {!canSubmit && "Please fill all required fields"}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!canSubmit} 
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4"/> Schedule Reminder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

export default NewReminderModal