<script lang="ts">
  import { baseURL } from "$lib/helpers";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { mapTypeToString } from "../home/components/dashboardutils";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { Toaster } from "$lib/components/ui/sonner";

  let fileNumber = "";
  let results: any[] = [];
  let selectedFiles: File[] = [];
  let loading = false;
  let showConfirmModal = false;
  let filePreviews: string[] = [];

  async function searchFileNumber() {
    loading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${fileNumber}`
      );
      results = await response.json();
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      loading = false;
    }
  }

  function openConfirmModal() {
    showConfirmModal = true;
  }

  function closeConfirmModal() {
    showConfirmModal = false;
  }

  async function uploadImages() {
    if (selectedFiles.length === 0) return;
    closeConfirmModal();
    const formData = new FormData();
    formData.append("fileNumber", fileNumber);
    selectedFiles.forEach((file) => {
      formData.append("attachment", file);
    });
    formData.append("attachmentName", "representation");
    loading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/migration/AdminUploadAttach`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (response.ok) {
        selectedFiles = [];
        filePreviews = [];
        toast.success("Upload successful! Redirecting to dashboard...", {
          position: "top-right",
          duration: 5000,
        });
        // Wait for toast to finish before redirecting
        setTimeout(async () => {
          await goto("/home/dashboard");
        }, 5000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Upload failed. Please try again.", {
          position: "top-right",
          duration: 5000,
        });
        loading = false;
      }
    } catch (error) {
      toast.error(
        "Upload failed. Please check your connection and try again.",
        {
          position: "top-right",
          duration: 5000,
        }
      );
      console.error("Upload failed:", error);
      loading = false;
    }
  }

  function handleFileSelect(e) {
    selectedFiles = Array.from(e.target.files);
    generatePreviews();
  }

  function generatePreviews() {
    filePreviews = [];
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreviews = [...filePreviews, e.target?.result as string];
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    filePreviews = filePreviews.filter((_, i) => i !== index);
  }
</script>

<Toaster />

<div class="container">
  <div class="header">
    <h1>Representation/Logo Re-Upload</h1>
    <p class="subtitle">Search and re-upload your representation</p>
  </div>

  <div class="card">
    <div class="form-group">
      <label for="fileNumber">File Number</label>
      <div class="input-wrapper">
        <input
          id="fileNumber"
          type="text"
          bind:value={fileNumber}
          placeholder="Enter file number"
          class="input-modern"
        />
        <button
          on:click={searchFileNumber}
          disabled={loading || !fileNumber}
          class="btn-primary"
        >
          {#if loading}
            <span class="spinner"></span>
          {:else}
            Search
          {/if}
        </button>
      </div>
    </div>

    {#if results.length > 0}
      <div class="results">
        <h2>Search Results</h2>
        <div class="results-grid">
          {#each results as result (result.fileId)}
            <div class="result-card">
              <div class="result-logo">
                {#if result.logoUrl}
                  <img
                    src={result.logoUrl}
                    alt={result.titleOfTradeMark ||
                      result.titleOfInvention ||
                      result.titleOfDesign}
                  />
                {:else}
                  <div class="logo-placeholder">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"
                      ></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                {/if}
              </div>
              <div class="result-info">
                <h3 class="result-title">
                  {result.titleOfTradeMark ||
                    result.titleOfInvention ||
                    result.titleOfDesign ||
                    "Untitled"}
                </h3>
                <div class="result-meta">
                  <span>
                    <AppStatusTag value={result.fileStatus} />
                  </span>
                  <p>
                    {mapTypeToString(result.fileType)}
                  </p>
                </div>
                <p>File Number: <b>{result.fileId}</b></p>
                <p>Applicant: <b>{result.fileApplicant}</b></p>
                <p>Class: <b>{result.tradeMarkClass}</b></p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if selectedFiles.length > 0}
      <div class="file-preview-section">
        <h3>Selected Files</h3>
        <div class="preview-grid">
          {#each selectedFiles as file, index (file.name + index)}
            <div class="preview-card">
              <button
                class="remove-btn"
                on:click={() => removeFile(index)}
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              {#if filePreviews[index]}
                <img src={filePreviews[index]} alt={file.name} />
              {:else}
                <div class="preview-loading">Loading...</div>
              {/if}
              <p class="preview-filename">{file.name}</p>
              <p class="preview-filesize">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="form-group">
      <label for="images">Upload Images</label>
      <div class="upload-area">
        <input
          id="images"
          type="file"
          multiple
          accept="image/*"
          on:change={handleFileSelect}
          class="file-input"
        />
        <div class="upload-placeholder">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p class="upload-text">
            {#if selectedFiles.length > 0}
              <strong
                >{selectedFiles.length} file{selectedFiles.length > 1
                  ? "s"
                  : ""} selected</strong
              >
            {:else}
              Click to select images or drag and drop
            {/if}
          </p>
          <p class="upload-hint">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
      <button
        on:click={openConfirmModal}
        disabled={loading || selectedFiles.length === 0}
        class="btn-upload"
      >
        {#if loading}
          <span class="spinner"></span>
          Uploading...
        {:else}
          Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
        {/if}
      </button>
    </div>
  </div>
</div>

{#if showConfirmModal}
  <div
    class="modal-backdrop"
    on:click={closeConfirmModal}
    on:keydown={(e) => e.key === "Escape" && closeConfirmModal()}
    role="presentation"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="modal" on:click|stopPropagation role="alertdialog">
      <div class="modal-header">
        <h2>Confirm Upload</h2>
        <button class="modal-close" on:click={closeConfirmModal}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-warning">
          ⚠️ This action will replace the current representation for file number <strong
            >{fileNumber}</strong
          >.
        </p>
        <p>
          You are about to upload <strong>{selectedFiles.length}</strong>
          file{selectedFiles.length > 1 ? "s" : ""}:
        </p>
        <ul class="modal-file-list">
          {#each selectedFiles as file}
            <li>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
          {/each}
        </ul>
        <p>Are you sure you want to continue?</p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" on:click={closeConfirmModal}>
          Cancel
        </button>
        <button class="btn-confirm" on:click={uploadImages}>
          Confirm Upload
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  * {
    box-sizing: border-box;
  }

  .container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%);
    padding: 2rem 1rem;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
      Cantarell, sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 0;
    border-bottom: none;
  }

  .header h1 {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 0.75rem 0;
    background: linear-gradient(135deg, #008751 0%, #00b368 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 1.1rem;
    margin: 0;
    color: #4a5568;
  }

  .card {
    max-width: 700px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 3rem;
    border: 1px solid rgba(0, 135, 81, 0.1);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  }

  .form-group {
    margin-bottom: 2rem;
  }

  label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #000000;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .input-wrapper {
    display: flex;
    gap: 0.75rem;
  }

  .input-modern {
    flex: 1;
    padding: 1rem 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    background: #ffffff;
  }

  .input-modern:focus {
    border-color: #008751;
    box-shadow: 0 0 0 4px rgba(0, 135, 81, 0.08);
    transform: translateY(-1px);
  }

  .btn-primary,
  .btn-upload {
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }

  .btn-primary::before,
  .btn-upload::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .btn-primary:hover:not(:disabled)::before,
  .btn-upload:hover:not(:disabled)::before {
    opacity: 1;
  }

  .btn-primary {
    background: linear-gradient(135deg, #008751 0%, #00a35e 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 135, 81, 0.2);
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #006d40 0%, #008751 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 135, 81, 0.3);
  }

  .btn-upload {
    width: 100%;
    background: linear-gradient(135deg, #008751 0%, #00a35e 100%);
    color: white;
    margin-top: 1rem;
    box-shadow: 0 4px 12px rgba(0, 135, 81, 0.2);
  }

  .btn-upload:hover:not(:disabled) {
    background: linear-gradient(135deg, #006d40 0%, #008751 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 135, 81, 0.3);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .results {
    margin-bottom: 2rem;
  }

  .results h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #000000;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #008751;
  }

  .results-grid {
    display: grid;
    gap: 1rem;
  }

  .result-card {
    display: flex;
    gap: 1.5rem;
    padding: 1.75rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid rgba(0, 135, 81, 0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .result-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 32px rgba(0, 135, 81, 0.15);
    border-color: #008751;
  }

  .result-logo {
    flex-shrink: 0;
    width: 90px;
    height: 90px;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(135deg, #f7fafc 0%, #ffffff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 135, 81, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .result-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .logo-placeholder {
    color: #cbd5e0;
  }

  .result-info {
    flex: 1;
    min-width: 0;
  }

  .result-title {
    margin: 0 0 0.75rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #000000;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .upload-area {
    position: relative;
    border: 2px dashed rgba(0, 135, 81, 0.3);
    border-radius: 16px;
    padding: 3rem 1.5rem;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #f7fafc 0%, #ffffff 100%);
  }

  .upload-area:hover {
    border-color: #008751;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 135, 81, 0.08);
    transform: translateY(-2px);
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .upload-placeholder {
    pointer-events: none;
  }

  .upload-placeholder svg {
    color: #008751;
    margin-bottom: 1rem;
  }

  .upload-text {
    font-size: 1rem;
    color: #000000;
    margin: 0 0 0.5rem 0;
  }

  .upload-hint {
    font-size: 0.875rem;
    color: #718096;
    margin: 0;
  }

  .file-preview-section {
    margin: 2rem 0;
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 12px;
  }

  .file-preview-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .preview-card {
    position: relative;
    background: white;
    border-radius: 12px;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .preview-card:hover {
    box-shadow: 0 4px 12px rgba(0, 135, 81, 0.1);
    transform: translateY(-2px);
  }

  .preview-card img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .preview-loading {
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7fafc;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    color: #718096;
    font-size: 0.875rem;
  }

  .preview-filename {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #000000;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-filesize {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: #718096;
  }

  .remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1;
  }

  .remove-btn:hover {
    background: rgb(220, 38, 38);
    transform: scale(1.1);
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #000000;
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #718096;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .modal-close:hover {
    color: #000000;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body p {
    margin: 0 0 1rem 0;
    color: #4a5568;
    line-height: 1.6;
  }

  .modal-warning {
    padding: 1rem;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 8px;
    color: #92400e;
    font-size: 0.9rem;
  }

  .modal-file-list {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
    max-height: 150px;
    overflow-y: auto;
  }

  .modal-file-list li {
    margin: 0.5rem 0;
    color: #4a5568;
    font-size: 0.9rem;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-confirm {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-cancel {
    background: #f7fafc;
    color: #4a5568;
  }

  .btn-cancel:hover {
    background: #e2e8f0;
  }

  .btn-confirm {
    background: linear-gradient(135deg, #008751 0%, #00a35e 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 135, 81, 0.2);
  }

  .btn-confirm:hover {
    background: linear-gradient(135deg, #006d40 0%, #008751 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 135, 81, 0.3);
  }

  :global([data-sonner-toast][data-type="success"]) {
    background: #10b981 !important;
    color: white !important;
    border: none !important;
  }

  :global([data-sonner-toast][data-type="error"]) {
    background: #ef4444 !important;
    color: white !important;
    border: none !important;
  }

  :global([data-sonner-toast] [data-icon]) {
    color: white !important;
  }

  :global([data-sonner-toast] [data-close-button]) {
    background: rgba(255, 255, 255, 0.2) !important;
    color: white !important;
    border: none !important;
  }

  @media (max-width: 640px) {
    .container {
      padding: 1rem 0.5rem;
    }

    .card {
      padding: 1.5rem;
      border-radius: 16px;
    }

    .header h1 {
      font-size: 2rem;
    }

    .input-wrapper {
      flex-direction: column;
    }

    .btn-primary {
      width: 100%;
    }

    .preview-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    .modal {
      width: 95%;
      margin: 1rem;
    }

    .modal-footer {
      flex-direction: column;
    }

    .btn-cancel,
    .btn-confirm {
      width: 100%;
    }
  }
</style>
