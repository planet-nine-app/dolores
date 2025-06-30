// Default configuration
var defaultConfig = {
    colors: {
        background: '#ffffff',
        text: {
            primary: '#1a1a1a',
            secondary: '#666666',
            accent: '#2563eb'
        },
        border: '#e5e5e5',
        shadow: 'rgba(0, 0, 0, 0.1)'
    },
    typography: {
        name: {
            fontSize: '18px',
            fontWeight: '600',
            lineHeight: '24px'
        },
        description: {
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px'
        },
        dateTime: {
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '18px'
        },
        address: {
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '16px'
        }
    },
    spacing: {
        containerPadding: '16px',
        sectionGap: '12px',
        textGap: '8px',
        imagePadding: '4px',
        imageBorderRadius: '8px',
        containerBorderRadius: '12px'
    },
    shadows: {
        container: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }
};

// SVG Icons
var icons = {
    clock: '<svg class="clock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/></svg>',
    location: '<svg class="location-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/></svg>',
    share: '<svg class="share-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" stroke-width="2"/><polyline points="16,6 12,2 8,6" stroke="currentColor" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" stroke-width="2"/></svg>',
    calendar: '<svg class="post-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/></svg>',
    map: '<svg class="post-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" stroke-width="2"/><line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" stroke-width="2"/></svg>',
    star: '<svg class="post-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" stroke-width="2"/></svg>',
    heart: '<svg class="post-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/></svg>',
    external: '<svg class="post-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2"/><polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"/></svg>',
    rsvp: '<svg class="post-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/><polyline points="17,11 19,13 23,9" stroke="currentColor" stroke-width="2"/></svg>'
};

// Utility functions
function formatDateTime(startDateTime, endDateTime) {
    var start = new Date(startDateTime);
    var end = new Date(endDateTime);
    
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    var isSameDay = start.toDateString() === end.toDateString();
    
    if (isSameDay) {
        return formatDate(start) + ' • ' + formatTime(start) + ' - ' + formatTime(end);
    } else {
        return formatDate(start) + ' ' + formatTime(start) + ' - ' + formatDate(end) + ' ' + formatTime(end);
    }
}

function linkifyText(text) {
    // Simple URL detection for https:// links
    var urlRegex = /(https:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

function applyCSSVariables(element, config) {
    var style = element.style;
    
    // Colors
    style.setProperty('--bg-color', config.colors.background);
    style.setProperty('--text-primary', config.colors.text.primary);
    style.setProperty('--text-secondary', config.colors.text.secondary);
    style.setProperty('--text-accent', config.colors.text.accent);
    style.setProperty('--border-color', config.colors.border);
    style.setProperty('--shadow-color', config.colors.shadow);
    
    // Typography
    style.setProperty('--name-font-size', config.typography.name.fontSize);
    style.setProperty('--name-font-weight', config.typography.name.fontWeight);
    style.setProperty('--name-line-height', config.typography.name.lineHeight);
    
    style.setProperty('--description-font-size', config.typography.description.fontSize);
    style.setProperty('--description-font-weight', config.typography.description.fontWeight);
    style.setProperty('--description-line-height', config.typography.description.lineHeight);
    
    style.setProperty('--datetime-font-size', config.typography.dateTime.fontSize);
    style.setProperty('--datetime-font-weight', config.typography.dateTime.fontWeight);
    style.setProperty('--datetime-line-height', config.typography.dateTime.lineHeight);
    
    style.setProperty('--address-font-size', config.typography.address.fontSize);
    style.setProperty('--address-font-weight', config.typography.address.fontWeight);
    style.setProperty('--address-line-height', config.typography.address.lineHeight);
    
    // Spacing
    style.setProperty('--container-padding', config.spacing.containerPadding);
    style.setProperty('--section-gap', config.spacing.sectionGap);
    style.setProperty('--text-gap', config.spacing.textGap);
    style.setProperty('--image-padding', config.spacing.imagePadding);
    style.setProperty('--image-border-radius', config.spacing.imageBorderRadius);
    style.setProperty('--container-border-radius', config.spacing.containerBorderRadius);
    
    // Shadows
    style.setProperty('--container-shadow', config.shadows.container);
}

// Image handling function
function createImageElement(imageUri, imageId, onImageLoad, onImageError) {
    if (imageUri) {
        // Direct URI provided
        var img = document.createElement('img');
        img.src = imageUri;
        img.alt = 'Post image';
        
        img.onload = function() {
            if (onImageLoad) onImageLoad(img);
        };
        
        img.onerror = function() {
            if (onImageError) onImageError(img);
        };
        
        return img;
    } else if (imageId) {
        // Legacy imageId support
        var img = document.createElement('img');
        img.src = '/images/' + imageId;
        img.alt = 'Post image';
        
        img.onload = function() {
            if (onImageLoad) onImageLoad(img);
        };
        
        img.onerror = function() {
            if (onImageError) onImageError(img);
        };
        
        return img;
    } else {
        // No image
        var placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = 'No Image';
        return placeholder;
    }
}

// Button creation functions
function createButtonHtml(button) {
    var iconHtml = button.icon && icons[button.icon] ? icons[button.icon] : '';
    var buttonClasses = 'post-button';
    
    if (button.type === 'single') {
        buttonClasses += ' post-button-single';
    } else {
        buttonClasses += ' post-button-dual';
        if (button.style) {
            buttonClasses += ' post-button-' + button.style;
        } else {
            buttonClasses += ' post-button-primary';
        }
    }
    
    return '<button class="' + buttonClasses + '" data-button-id="' + (button.id || '') + '">' +
        iconHtml + 
        '<span>' + button.text + '</span>' +
        '</button>';
}

function createButtonsSection(buttonsConfig) {
    if (!buttonsConfig) return '';
    
    var html = '<div class="post-buttons-container">';
    
    if (buttonsConfig.single) {
        // Single full-width button
        html += createButtonHtml({
            ...buttonsConfig.single,
            type: 'single'
        });
    }
    
    if (buttonsConfig.dual && buttonsConfig.dual.length === 2) {
        // Two buttons side-by-side
        html += '<div class="post-buttons-dual">';
        buttonsConfig.dual.forEach(function(button) {
            html += createButtonHtml({
                ...button,
                type: 'dual'
            });
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function createPost(postData, config, onPostClick, onNameClick, onDateTimeClick, onAddressClick, onShareClick, onButtonClick) {
    config = config || defaultConfig;
    onPostClick = onPostClick || null;
    onNameClick = onNameClick || function() { alert('Name clicked: ' + postData.name); };
    onDateTimeClick = onDateTimeClick || function(dateTime) { alert('DateTime clicked: ' + formatDateTime(dateTime.startDateTime, dateTime.endDateTime)); };
    onAddressClick = onAddressClick || function() { alert('Address clicked: ' + postData.address.line1 + ', ' + postData.address.line2); };
    onShareClick = onShareClick || function() { alert('Share clicked for: ' + postData.name); };
    onButtonClick = onButtonClick || function(buttonId, buttonText) { alert('Button clicked: ' + buttonText + ' (' + buttonId + ')'); };
    
    var postCard = document.createElement('div');
    postCard.className = 'post-card';
    
    // Apply configuration
    applyCSSVariables(postCard, config);
    
    var dateTimeHtml = '';
    for (var i = 0; i < postData.dateTimes.length; i++) {
        dateTimeHtml += '<div class="post-datetime" data-datetime-index="' + i + '">' +
            icons.clock +
            formatDateTime(postData.dateTimes[i].startDateTime, postData.dateTimes[i].endDateTime) +
            '</div>';
    }
    
    var linkedDescription = linkifyText(postData.description);
    
    // Determine layout type
    var isImageOnly = postData.layout === 'image-only';
    var topSectionClass = isImageOnly ? 'post-top-section image-only' : 'post-top-section';
    var imageClass = isImageOnly ? 'post-image-full' : 'post-image';
    
    var topSectionContent = '';
    if (isImageOnly) {
        // Image-only layout
        topSectionContent = '<div class="' + imageClass + '" id="image-container-' + Math.random().toString(36).substr(2, 9) + '">' +
            '<div class="image-loading">Loading...</div>' +
        '</div>';
    } else {
        // Mixed layout (image + description)
        topSectionContent = '<div class="' + imageClass + '" id="image-container-' + Math.random().toString(36).substr(2, 9) + '">' +
            '<div class="image-loading">Loading...</div>' +
        '</div>' +
        '<div class="post-description-container">' +
            '<div class="post-description">' + linkedDescription + '</div>' +
        '</div>';
    }
    
    var descriptionSection = '';
    if (isImageOnly && postData.description) {
        // For image-only layout, put description below the image
        descriptionSection = '<div class="post-description" style="margin-bottom: var(--text-gap, 8px);">' + linkedDescription + '</div>';
    }
    
    // Textarea section
    var textareaSection = '';
    if (postData.enableTextArea) {
        var textareaValue = postData.textAreaValue || '';
        var placeholderText = postData.textAreaPlaceholder || 'Share your thoughts...';
        textareaSection = 
            '<div class="post-textarea-container">' +
                '<textarea class="post-textarea" placeholder="' + placeholderText + '" maxlength="500">' + textareaValue + '</textarea>' +
                '<div class="post-textarea-info">' +
                    '<span>Links will be automatically detected</span>' +
                    '<span class="post-textarea-char-count">0/500</span>' +
                '</div>' +
                '<div class="post-textarea-preview" style="display: none;"></div>' +
            '</div>';
    }
    
    // Buttons section
    var buttonsSection = createButtonsSection(postData.buttons);
    
    postCard.innerHTML = 
        '<div class="post-content">' +
            '<div class="' + topSectionClass + '">' +
                topSectionContent +
            '</div>' +
            descriptionSection +
            textareaSection +
            buttonsSection +
            '<div class="post-name">' + postData.name + '</div>' +
            '<div class="post-datetime-container">' +
                dateTimeHtml +
            '</div>' +
            '<div class="post-address-container">' +
                '<div class="post-address-text">' +
                    '<div class="post-address post-address-line1">' +
                        icons.location + postData.address.line1 +
                    '</div>' +
                    '<div class="post-address post-address-line2">' + postData.address.line2 + '</div>' +
                '</div>' +
                '<button class="post-share-button">' + icons.share + '</button>' +
            '</div>' +
        '</div>';
    
    // Handle image loading
    var imageContainer = postCard.querySelector('.' + imageClass);
    var imageElement = createImageElement(
        postData.imageUri,
        postData.imageId,
        function(img) {
            // Image loaded successfully
            imageContainer.innerHTML = '';
            imageContainer.appendChild(img);
        },
        function(img) {
            // Image failed to load
            imageContainer.innerHTML = '<div class="image-error">Image failed to load</div>';
        }
    );
    
    // If we have a placeholder (no image), show it immediately
    if (imageElement.className === 'placeholder') {
        imageContainer.innerHTML = '';
        imageContainer.appendChild(imageElement);
    }
    
    // Handle textarea functionality
    var textarea = postCard.querySelector('.post-textarea');
    if (textarea) {
        var charCount = postCard.querySelector('.post-textarea-char-count');
        var preview = postCard.querySelector('.post-textarea-preview');
        
        function updateTextarea() {
            var value = textarea.value;
            var length = value.length;
            
            // Update character count
            charCount.textContent = length + '/500';
            charCount.className = 'post-textarea-char-count';
            if (length > 450) {
                charCount.classList.add('warning');
            }
            if (length >= 500) {
                charCount.classList.add('error');
            }
            
            // Update preview with linkified text
            if (value.trim()) {
                preview.innerHTML = linkifyText(value);
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }
        
        // Initial update
        updateTextarea();
        
        // Add event listeners
        textarea.addEventListener('input', updateTextarea);
        textarea.addEventListener('paste', function() {
            setTimeout(updateTextarea, 10);
        });
    }
    
    // Handle button clicks
    var buttons = postCard.querySelectorAll('.post-button');
    buttons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            var buttonId = button.getAttribute('data-button-id') || '';
            var buttonText = button.querySelector('span').textContent;
            onButtonClick(buttonId, buttonText, postData);
        });
    });
    
    // Add main post click handler
    if (onPostClick) {
        postCard.addEventListener('click', function(e) {
            // Don't trigger post click if clicking on interactive elements
            if (!e.target.closest('.post-name, .post-datetime, .post-address, .post-share-button, .post-description a, .post-button, .post-textarea')) {
                onPostClick(postData);
            }
        });
    }
    
    // Name click handler
    var nameElement = postCard.querySelector('.post-name');
    nameElement.addEventListener('click', function(e) {
        e.stopPropagation();
        onNameClick(postData);
    });
    
    // DateTime click handlers
    var dateTimeElements = postCard.querySelectorAll('.post-datetime');
    for (var i = 0; i < dateTimeElements.length; i++) {
        (function(index) {
            dateTimeElements[index].addEventListener('click', function(e) {
                e.stopPropagation();
                onDateTimeClick(postData.dateTimes[index], postData);
            });
        })(i);
    }
    
    // Address click handlers
    var addressElements = postCard.querySelectorAll('.post-address');
    for (var i = 0; i < addressElements.length; i++) {
        addressElements[i].addEventListener('click', function(e) {
            e.stopPropagation();
            onAddressClick(postData);
        });
    }
    
    // Share click handler
    var shareButton = postCard.querySelector('.post-share-button');
    shareButton.addEventListener('click', function(e) {
        e.stopPropagation();
        onShareClick(postData);
    });
    
    return postCard;
}

// Alternative theme configs
var darkConfig = {
    colors: {
        background: '#1f1f1f',
        text: {
            primary: '#ffffff',
            secondary: '#a3a3a3',
            accent: '#60a5fa'
        },
        border: '#404040',
        shadow: 'rgba(0, 0, 0, 0.3)'
    },
    typography: {
        name: {
            fontSize: '18px',
            fontWeight: '600',
            lineHeight: '24px'
        },
        description: {
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px'
        },
        dateTime: {
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '18px'
        },
        address: {
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '16px'
        }
    },
    spacing: {
        containerPadding: '16px',
        sectionGap: '12px',
        textGap: '8px',
        imagePadding: '4px',
        imageBorderRadius: '8px',
        containerBorderRadius: '12px'
    },
    shadows: {
        container: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }
};

var colorfulConfig = {
    colors: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        text: {
            primary: '#ffffff',
            secondary: '#e2e8f0',
            accent: '#fbbf24'
        },
        border: 'rgba(255, 255, 255, 0.2)',
        shadow: 'rgba(0, 0, 0, 0.2)'
    },
    typography: {
        name: {
            fontSize: '18px',
            fontWeight: '600',
            lineHeight: '24px'
        },
        description: {
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px'
        },
        dateTime: {
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '18px'
        },
        address: {
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '16px'
        }
    },
    spacing: {
        containerPadding: '16px',
        sectionGap: '12px',
        textGap: '8px',
        imagePadding: '6px',
        imageBorderRadius: '12px',
        containerBorderRadius: '12px'
    },
    shadows: {
        container: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }
};

// Utility function to get textarea value from a post
function getTextAreaValue(postElement) {
    var textarea = postElement.querySelector('.post-textarea');
    return textarea ? textarea.value : null;
}

// Export for use in Tauri
window.PostComponent = {
    createPost: createPost,
    defaultConfig: defaultConfig,
    darkConfig: darkConfig,
    colorfulConfig: colorfulConfig,
    icons: icons,
    formatDateTime: formatDateTime,
    applyCSSVariables: applyCSSVariables,
    linkifyText: linkifyText,
    createImageElement: createImageElement,
    getTextAreaValue: getTextAreaValue,
    createButtonHtml: createButtonHtml,
    createButtonsSection: createButtonsSection
};
