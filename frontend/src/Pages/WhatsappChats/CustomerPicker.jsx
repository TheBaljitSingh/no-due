import React, { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, Plus, UserRound } from "lucide-react";

function CustomerPicker({ items = [], onSelect, selected }) {
  //selected here use for label naming

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Choose User to chat");
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const [searchText, setSearchText] = useState("");

  // close on outside click or Escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (
        popRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (value, text) => {
    //id, name(customerName)

    setLabel(text);
    setOpen(false);
    onSelect?.(value);
  };

  useEffect(() => {
    if (!selected) {
      setLabel("Choose User to Chat");
    } else {
      setLabel(selected?.name);
    }
  }, [selected]);



  const filteredCustomer = useMemo(() => {

    if (!searchText) return items;

    return items.filter(it => it.name.toLowerCase().includes(searchText.toLowerCase()));

  }, [items, searchText]);


  useEffect(() => {
    filteredCustomer
  }, [searchText]);


  return (
    <div className="relative inline-block text-left">
      {/* Button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex justify-between items-center min-w-[240px] rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700
                   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none shadow-sm"
        aria-haspopup="true"
        aria-expanded={open}
        w-full border shadow-accertinity inline px-4 py-3 rounded-xl

      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`ml-2 h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={popRef}
          className="absolute z-50 mt-2 w-72 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black/10 animate-in fade-in slide-in-from-top-1 duration-200"
          role="menu"
        >
          {
            items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-24 h-24 mb-4">
                  <img
                    src="https://img.freepik.com/premium-vector/no-data-found-empty-file-folder-concept-design-vector-illustration_620585-1698.jpg"
                    alt="No customers"
                    className="w-full h-full object-contain opacity-60"
                  />
                </div>
                <p className="text-sm text-gray-500">No customers found</p>
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto py-1" role="none">

                <li className="sticky top-0 bg-white border-b border-gray-200 p-2 z-10">
                  <input
                    type="text"
                    value={searchText}
                    placeholder="Search customers..."
                    className="inline-flex justify-between items-center min-w-[240px] rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700
                   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 
                         focus:border-gray-300 focus:bg-gray-100 border-transparent 
                         transition-all duration-200 outline-none shadow-sm"
                    onChange={(e) => {
                      setSearchText(e.target.value);
                    }}
                  />
                </li>
                {filteredCustomer.slice(0, 10).map((it, idx) => (
                  <li key={idx} role="none">
                    <button
                      type="button"
                      onClick={() => choose(it, it.name)} // {customer, name}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      role="menuitem"
                    >
                      <img
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100"
                        src={it.gender === 'male'
                          ? "https://img.freepik.com/free-vector/smiling-man-with-glasses_1308-174409.jpg"
                          : "https://img.freepik.com/free-vector/smiling-woman-with-long-brown-hair_1308-175662.jpg"}
                        alt={`${it.name}'s profile`}
                      />
                      <span className="flex-1 truncate font-medium">{it.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          }

          {/* <button
            type="button"
            onClick={() => choose("add-new", "Add new customer")}
            className="flex w-full items-center gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-green-600
                       hover:bg-green-50 hover:text-green-700 transition-colors"
            role="menuitem"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add new customer
          </button> */}
        </div>
      )}
    </div>
  );
}

export default CustomerPicker;