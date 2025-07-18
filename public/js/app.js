// App state
let walletInfo = null;
let uploadedPhotos = JSON.parse(localStorage.getItem('uploadedPhotos') || '[]');

// DOM elements
const walletAddress = document.getElementById('wallet-address');
const walletBalance = document.getElementById('wallet-balance');
const solBalance = document.getElementById('sol-balance');
const photoCount = document.getElementById('photo-count');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const timeline = document.getElementById('timeline');
const photoModal = document.getElementById('photoModal');
const modalImage = document.getElementById('modalImage');
const modalId = document.getElementById('modalId');
const modalDate = document.getElementById('modalDate');
const modalSize = document.getElementById('modalSize');
const toastContainer = document.getElementById('toastContainer');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadWalletInfo();
    renderTimeline();
});

// Setup event listeners
function setupEventListeners() {
    // Upload zone click
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);

    // Modal close
    photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) {
            closeModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// File handling functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        validateAndProcessFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            validateAndProcessFile(file);
        } else {
            showToast('Please upload an image file', 'error');
        }
    }
}

function validateAndProcessFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size too large. Maximum 10MB allowed', 'error');
        return;
    }
    
    // Process the file
    handleUpload(file);
}

// Upload function
function handleUpload(file) {
    // Show progress
    uploadProgress.style.display = 'block';
    uploadZone.style.display = 'none';
    
    // Create FormData
    const formData = new FormData();
    formData.append('photo', file);
    
    // Upload to server
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Check if upload was successful (has id and url)
        if (data.id && data.url) {
            // Save photo info
            const photoInfo = {
                id: data.id,
                name: file.name,
                size: file.size,
                uploadDate: new Date().toISOString(),
                gatewayUrl: data.url
            };
            
            uploadedPhotos.unshift(photoInfo);
            localStorage.setItem('uploadedPhotos', JSON.stringify(uploadedPhotos));
            
            showToast('Photo uploaded successfully!', 'success');
            renderTimeline();
            resetUploadForm();
        } else {
            showToast(data.error || 'Upload failed', 'error');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showToast('Upload failed. Please try again.', 'error');
    })
    .finally(() => {
        uploadProgress.style.display = 'none';
        uploadZone.style.display = 'block';
        fileInput.value = ''; // Clear file input
    });
}

// Reset upload form
function resetUploadForm() {
    fileInput.value = '';
    uploadZone.style.display = 'block';
    uploadProgress.style.display = 'none';
}

// Wallet functions
function loadWalletInfo() {
    // Find the refresh button and provide feedback
    const refreshBtn = Array.from(document.querySelectorAll('.action-btn')).find(btn => 
        btn.textContent.includes('Refresh') || btn.onclick?.toString().includes('loadWalletInfo')
    );
    
    if (refreshBtn) {
        const originalContent = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        
        fetch('/api/balance')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Check if data has the expected wallet info structure
                if (data.address && data.balance !== undefined) {
                    walletInfo = data;
                    displayWalletInfo();
                    showToast('Wallet info refreshed', 'success');
                } else {
                    showToast(data.error || 'Failed to load wallet info', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading wallet info:', error);
                showToast('Failed to load wallet info', 'error');
            })
            .finally(() => {
                refreshBtn.innerHTML = originalContent;
                refreshBtn.disabled = false;
            });
    } else {
        // Fallback for initial load without button feedback
        fetch('/api/balance')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Check if data has the expected wallet info structure
                if (data.address && data.balance !== undefined) {
                    walletInfo = data;
                    displayWalletInfo();
                } else {
                    showToast(data.error || 'Failed to load wallet info', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading wallet info:', error);
                showToast('Failed to load wallet info', 'error');
            });
    }
}

function displayWalletInfo() {
    if (walletInfo) {
        walletAddress.textContent = `${walletInfo.address.slice(0, 4)}...${walletInfo.address.slice(-4)}`;
        walletBalance.textContent = walletInfo.balance;
        if (walletInfo.solBalance !== undefined) {
            solBalance.textContent = walletInfo.solBalance;
        }
        photoCount.textContent = uploadedPhotos.length;
    }
}



async function fundWallet() {
    // Find the fund wallet button by its onclick attribute or text content
    const fundBtn = Array.from(document.querySelectorAll('.action-btn')).find(btn => 
        btn.textContent.includes('Fund Wallet') || btn.onclick?.toString().includes('fundWallet')
    );
    
    if (!fundBtn) {
        console.error('Fund wallet button not found');
        showToast('Fund wallet button not found', 'error');
        return;
    }
    
    const originalContent = fundBtn.innerHTML;
    
    fundBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Funding...';
    fundBtn.disabled = true;
    
    try {
        const response = await fetch('/api/fund', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: 0.1 })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`Wallet funded: ${result.quantity} ${walletInfo.token}`, 'success');
            await loadWalletInfo();
        } else {
            showToast(result.error || 'Funding failed', 'error');
        }
    } catch (error) {
        console.error('Funding error:', error);
        showToast('Funding failed. Please try again.', 'error');
    } finally {
        fundBtn.innerHTML = originalContent;
        fundBtn.disabled = false;
    }
}

async function requestFaucet() {
    // Find the faucet button by its text content
    const faucetBtn = Array.from(document.querySelectorAll('.action-btn')).find(btn => 
        btn.textContent.includes('Get SOL') || btn.onclick?.toString().includes('requestFaucet')
    );
    
    if (!faucetBtn) {
        console.error('Faucet button not found');
        showToast('Faucet button not found', 'error');
        return;
    }
    
    const originalContent = faucetBtn.innerHTML;
    
    faucetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
    faucetBtn.disabled = true;
    
    try {
        const response = await fetch('/api/faucet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`Airdrop successful: ${result.amount} SOL`, 'success');
            await loadWalletInfo();
        } else {
            showToast(result.error || 'Airdrop failed', 'error');
        }
    } catch (error) {
        console.error('Airdrop error:', error);
        showToast('Airdrop failed. Please try again.', 'error');
    } finally {
        faucetBtn.innerHTML = originalContent;
        faucetBtn.disabled = false;
    }
}

function copyAddress() {
    if (walletInfo) {
        navigator.clipboard.writeText(walletInfo.address).then(() => {
            showToast('Address copied to clipboard', 'success');
        }).catch(() => {
            showToast('Failed to copy address', 'error');
        });
    }
}

// Timeline functions
function renderTimeline() {
    if (uploadedPhotos.length === 0) {
        timeline.innerHTML = `
            <div class="timeline-empty">
                <div class="empty-icon">
                    <i class="fas fa-camera"></i>
                </div>
                <h3>No photos yet</h3>
                <p>Share your first photo to get started</p>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = uploadedPhotos.map(photo => `
        <div class="timeline-item">
            <div class="timeline-header">
                <div class="timeline-avatar">
                    <img src="/manish.png" alt="0xdevrel" class="timeline-profile-pic">
                </div>
                <div class="timeline-info">
                    <a href="https://x.com/0xdevrel" target="_blank" rel="noopener noreferrer" class="timeline-user">0xdevrel</a>
                    <span class="timeline-date">${formatDate(photo.uploadDate)}</span>
                </div>
                <div class="timeline-actions">
                    <button class="timeline-action-btn delete-btn" onclick="deletePhoto('${photo.id}')" title="Delete photo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="timeline-content">
                <img src="${photo.gatewayUrl}" alt="${photo.name}" loading="lazy">
            </div>
            <div class="timeline-footer">
                <div class="timeline-stats">
                    <span class="timeline-stat">
                        <i class="fas fa-database"></i>
                        IRYS • ${formatFileSize(photo.size)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update photo count
    if (photoCount) {
        photoCount.textContent = uploadedPhotos.length;
    }
}

function openModal(photoId) {
    const photo = uploadedPhotos.find(p => p.id === photoId);
    if (photo) {
        modalImage.src = photo.gatewayUrl;
        modalId.textContent = photo.id;
        modalDate.textContent = formatDate(photo.uploadDate);
        modalSize.textContent = formatFileSize(photo.size);
        photoModal.style.display = 'flex';
        
        // Store current photo for copy function
        photoModal.dataset.currentPhotoId = photoId;
    }
}

function closeModal() {
    photoModal.style.display = 'none';
}

function copyId() {
    const currentPhotoId = photoModal.dataset.currentPhotoId;
    if (currentPhotoId) {
        navigator.clipboard.writeText(currentPhotoId)
            .then(() => showToast('ID copied to clipboard', 'success'))
            .catch(() => showToast('Failed to copy ID', 'error'));
    }
}

function viewOnGateway() {
    const currentPhotoId = photoModal.dataset.currentPhotoId;
    if (currentPhotoId) {
        const photo = uploadedPhotos.find(p => p.id === currentPhotoId);
        if (photo) {
            window.open(photo.gatewayUrl, '_blank');
        }
    }
}

function toggleProfile() {
    const profileSection = document.querySelector('.profile-section');
    profileSection.classList.toggle('active');
}

function deletePhoto(photoId) {
    if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
        // Remove photo from array
        uploadedPhotos = uploadedPhotos.filter(photo => photo.id !== photoId);
        
        // Update localStorage
        localStorage.setItem('uploadedPhotos', JSON.stringify(uploadedPhotos));
        
        // Re-render timeline
        renderTimeline();
        
        // Close modal if it was open for this photo
        if (photoModal.style.display === 'flex' && photoModal.dataset.currentPhotoId === photoId) {
            closeModal();
        }
        
        showToast('Photo deleted successfully', 'success');
    }
}

function clearGallery() {
    if (confirm('Are you sure you want to clear all photos? This action cannot be undone.')) {
        uploadedPhotos = [];
        localStorage.removeItem('uploadedPhotos');
        renderTimeline();
        showToast('Gallery cleared', 'success');
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Add slideOutRight animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
