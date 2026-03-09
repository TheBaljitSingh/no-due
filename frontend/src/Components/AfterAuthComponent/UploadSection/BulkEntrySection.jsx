import React, { useEffect, useRef, useState } from "react";
import PageHeaders from "../../../utils/AfterAuthUtils/PageHeaders";
import {
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import PreviewCustomerModel from "./PreviewCustomerModel";
import {
  validateBulkCustomers,
  bulkUploadSSE,
} from "../../../utils/service/customerService";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import toast from "react-hot-toast";

// ─── tiny helpers ──────────────────────────────────────────────────────────
const FIELD_LABELS = {
  name: "Name",
  mobile: "Mobile",
  email: "Email",
  status: "Status",
  amount: "Amount",
};

const ValidationErrorTable = ({ errors, onDismiss }) => (
  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 bg-red-100 border-b border-red-200">
      <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
        <AlertCircle size={16} />
        {errors.length} validation error{errors.length > 1 ? "s" : ""} found —
        fix your file and re-upload
      </div>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 transition"
      >
        <XCircle size={18} />
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-red-100 text-red-600 uppercase tracking-wide">
            <th className="px-4 py-2 text-left font-semibold w-16">Row</th>
            <th className="px-4 py-2 text-left font-semibold w-24">Field</th>
            <th className="px-4 py-2 text-left font-semibold">Your Value</th>
            <th className="px-4 py-2 text-left font-semibold">Error</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-red-50"}>
              <td className="px-4 py-2 text-red-500 font-medium">{e.row}</td>
              <td className="px-4 py-2 text-gray-700 font-medium">
                {FIELD_LABELS[e.field] ?? e.field}
              </td>
              <td className="px-4 py-2 text-gray-500 max-w-[160px] truncate font-mono">
                {String(e.value || "(empty)")}
              </td>
              <td className="px-4 py-2 text-red-600">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── SSE Progress Overlay ──────────────────────────────────────────────────
const UploadProgressOverlay = ({ progress }) => {
  const {
    phase,
    processed,
    total,
    currentName,
    saving,
    done,
    created,
    updated,
    error,
  } = progress;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[92%] max-w-md bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 animate-fadeIn">
        {error ? (
          <>
            <XCircle size={48} className="text-red-500" />
            <p className="text-center font-semibold text-gray-800">
              Upload Failed
            </p>
            <p className="text-sm text-red-500 text-center">{error}</p>
          </>
        ) : done ? (
          <>
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="text-center font-semibold text-gray-800 text-lg">
              Upload Complete!
            </p>
            <div className="flex gap-6 text-sm text-gray-600">
              <span>
                ✅ <strong>{created}</strong> created
              </span>
              <span>
                🔄 <strong>{updated}</strong> updated
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Redirecting to customer list…
            </p>
          </>
        ) : (
          <>
            <Loader2 size={40} className="text-green-600 animate-spin" />

            {saving ? (
              <p className="text-gray-700 font-semibold text-base">
                Saving to database…
              </p>
            ) : (
              <>
                <p className="text-gray-700 font-semibold text-base text-center">
                  Preparing customer {processed} of {total}
                  {currentName ? (
                    <span className="text-gray-400 font-normal">
                      {" "}
                      — {currentName}
                    </span>
                  ) : null}
                </p>
                {/* progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {pct}% — building upload batch…
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const BulkEntrySection = ({ paymentTerms }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState({});
  const previewRef = useRef();
  const navigate = useNavigate();
  const [continueFile, setContinueFile] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [open, setOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // null = hidden

  useEffect(() => {
    const handleMouseClick = (e) => {
      if (!showPreview) return;
      if (previewRef !== undefined && previewRef.current?.contains(e.target))
        return;
      setShowPreview(false);
    };
    document.addEventListener("mousedown", handleMouseClick);
    return () => document.removeEventListener("mousedown", handleMouseClick);
  });

  const csvFileToJson = async (file) => {
    setIsParsing(true);
    setValidationErrors([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      const extension = file.name.split(".").pop().toLowerCase();
      if (extension === "csv") {
        await workbook.csv.read(new Blob([buffer]).stream());
      } else {
        await workbook.xlsx.load(buffer);
      }

      const sheet = workbook.getWorksheet(1);
      if (!sheet || sheet.rowCount === 0) {
        toast.error("The uploaded file has no data");
        setSelectedFile(null);
        return;
      }

      const headers = [];
      const jsonData = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => headers.push(String(cell.value).trim()));
        } else {
          const obj = {};
          row.eachCell((cell, colNumber) => {
            const value = cell.value;
            obj[headers[colNumber - 1]] =
              value !== null && value !== undefined ? value : "";
          });
          jsonData.push(obj);
        }
      });

      setPreviewData(jsonData);
    } catch (error) {
      console.error("File parsing error:", error);
      toast.error(
        "Failed to parse the file. Please ensure it is a valid Excel or CSV file.",
      );
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  // ── Step 1: validate before showing confirm modal ──
  const handlePreviewAndValidate = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);
    try {
      const result = await validateBulkCustomers(previewData);
      if (!result?.data?.valid) {
        setValidationErrors(result?.data?.errors ?? []);
        toast.error(
          `${result?.data?.errors?.length} validation error(s) — fix your file and re-upload`,
        );
        return;
      }
      // All rows valid → show preview
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not validate file. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmitEntry = async () => {
    setContinueFile(false);
    setUploadProgress({
      phase: 1,
      processed: 0,
      total: previewData.length,
      saving: false,
      done: false,
    });

    try {
      await bulkUploadSSE(previewData, (event) => {
        if (event.type === "progress") {
          setUploadProgress((prev) => ({
            ...prev,
            phase: 1,
            processed: event.processed,
            total: event.total,
            currentName: event.name,
            saving: false,
          }));
        } else if (event.type === "saving") {
          setUploadProgress((prev) => ({ ...prev, saving: true }));
        } else if (event.type === "done") {
          setUploadProgress((prev) => ({
            ...prev,
            saving: false,
            done: true,
            created: event.created,
            updated: event.updated,
          }));
          setTimeout(() => {
            setUploadProgress(null);
            setSelectedFile(null);
            setPreviewData({});
            navigate("/nodue/customer-master");
          }, 2500);
        } else if (event.type === "error") {
          setUploadProgress((prev) => ({ ...prev, error: event.message }));
          setTimeout(() => setUploadProgress(null), 4000);
        }
      });
    } catch (error) {
      console.error(error);
      setUploadProgress((prev) => ({
        ...prev,
        error: error?.message || "Upload failed. Please try again.",
      }));
      setTimeout(() => setUploadProgress(null), 4000);
    }
  };
  const handleDownloadCSVFormat = () => {
    const link = document.createElement("a");
    link.href =
      "https://res.cloudinary.com/dzdt11nsx/raw/upload/v1772792867/Updated_Test_Data_d0br4m.xlsx";
    link.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewData({});
    setValidationErrors([]);
  };

  return (
    <div className="min-w-0 w-full">
      <PageHeaders
        header={"Upload Bulk Entries"}
        subheader={
          "Import multiple customer records at once using CSV or Excel files"
        }
        handleOnClick={handleDownloadCSVFormat}
        buttonName={"Download Template"}
      />

      {/* Drop zone */}
      <div className="flex items-center justify-center w-full mt-6">
        <label
          htmlFor="dropzone-file"
          className={`relative flex flex-col items-center justify-center w-1/2 h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors group ${isParsing || isValidating ? "pointer-events-none opacity-60" : ""}`}
        >
          {(isParsing || isValidating) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg z-10">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="mt-3 text-sm font-medium text-gray-600">
                {isValidating ? "Validating rows..." : "Parsing file..."}
              </p>
            </div>
          )}
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-5">
            <div className="mb-4 p-3 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
              <UploadCloud className="w-8 h-8 text-green-600" />
            </div>
            <p className="mb-2 text-sm text-gray-700">
              <span className="font-semibold text-green-600">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              CSV, XLS, or XLSX files only
            </p>

            {selectedFile && !isParsing && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-green-600">
                    {selectedFile.name}
                  </span>
                </span>
              </div>
            )}
          </div>
          <input
            id="dropzone-file"
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedFile(file);
                setValidationErrors([]);
                csvFileToJson(file);
              }
              e.target.value = "";
            }}
            className="hidden"
            disabled={isParsing || isValidating}
          />
        </label>
      </div>

      {/* Validation error table */}
      {validationErrors.length > 0 && (
        <ValidationErrorTable
          errors={validationErrors}
          onDismiss={() => setValidationErrors([])}
        />
      )}

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6">
        <button
          onClick={handleClearFile}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          disabled={!selectedFile}
        >
          {validationErrors.length > 0 ? (
            <span className="flex items-center gap-1">
              <RefreshCw size={14} /> Fix & Re-upload
            </span>
          ) : (
            "Clear File"
          )}
        </button>

        <button
          onClick={handlePreviewAndValidate}
          className="px-5 py-2.5 text-sm font-medium text-white component-button-green transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedFile || isParsing || isValidating}
        >
          {isValidating
            ? "Validating..."
            : isParsing
              ? "Parsing..."
              : "Preview & Create Entries"}
        </button>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div ref={previewRef}>
          <PreviewCustomerModel
            data={previewData}
            setData={setPreviewData}
            handleClose={() => setShowPreview(false)}
            setContinueFile={setContinueFile}
          />
        </div>
      )}

      {/* Payment term confirm modal */}
      {continueFile && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm py-12">
          <div className="w-[92%] max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div className="w-1/2">
                <h2 className="text-lg font-semibold text-gray-800">
                  Confirm Payment Terms
                </h2>
                <p className="text-sm text-gray-500">
                  Select a payment term to apply to all uploaded entries
                </p>
              </div>
              <button
                onClick={() => setContinueFile(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Payment Term
              </label>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between border border-gray-300 rounded-lg px-4 py-3 text-sm text-left bg-white"
              >
                {selectedTerm
                  ? `${selectedTerm.name} — ${selectedTerm.creditDays} days`
                  : "Select Payment Term"}
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${open ? "rotate-180" : ""} text-gray-500`}
                />
              </button>

              {open && (
                <div className="absolute z-50 -mt-3 w-1/2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {paymentTerms.map((term) => (
                    <div
                      key={term._id}
                      onClick={() => {
                        setSelectedTerm(term);
                        setOpen(false);
                        const updatedData = previewData.map((item) => ({
                          ...item,
                          paymentTerm: term._id,
                        }));
                        setPreviewData(updatedData);
                      }}
                      className="px-4 py-2 bg-gray-300 text-sm hover:bg-green-50 cursor-pointer"
                    >
                      {term.name} — {term.creditDays} days
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">
                This payment term will be applied to all selected customers.
              </p>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setContinueFile(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEntry}
                className="px-6 py-2 text-sm font-medium text-white rounded-lg component-button-green shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Submit Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SSE upload progress overlay */}
      {uploadProgress && <UploadProgressOverlay progress={uploadProgress} />}
    </div>
  );
};

export default BulkEntrySection;
