document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const header = document.getElementById('main-header');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('#navbar .nav-links a'); // Desktop links
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = document.querySelectorAll('#mobile-menu .mobile-nav-links a'); // Mobile links
    const hamburger = document.getElementById('hamburger-button');
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const currentYearSpan = document.getElementById('current-year');
    const backToTopButton = document.getElementById('back-to-top-button');
    const serviceItems = document.querySelectorAll('.service-item'); // Service modal triggers
    const portfolioItems = document.querySelectorAll('.portfolio-item'); // Portfolio modal triggers
    const blogReadMoreButtons = document.querySelectorAll('.read-more-btn'); // Blog modal triggers
    const modal = document.getElementById('modal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalServiceImage = document.getElementById('modal-service-image'); // Used for Service OR Blog featured image
    const modalSlideshow = document.getElementById('modal-slideshow');
    const modalSlideshowImage = document.getElementById('modal-slideshow-image');
    const slidePrevButton = document.getElementById('slide-prev');
    const slideNextButton = document.getElementById('slide-next');
    const slideCounter = document.getElementById('slide-counter');
    const compareContainer = document.getElementById('image-compare-modal-container');
    const compareTopClipper = document.getElementById('modal-compare-top-clipper');
    const compareSlider = document.getElementById('modal-compare-slider');
    const faqItems = document.querySelectorAll('.faq-item'); // FAQ items (<details> elements)

    // --- Modal State ---
    let currentSlideIndex = 0;
    let currentImages = []; // For portfolio slideshow
    let touchStartX = 0;
    let touchEndX = 0;
    let elementThatOpenedModal = null;

    // *** Image Comparison State ***
    let isCompareDragging = false;
    let compareImagesLoadedCount = 0;

    // --- Set Current Year in Footer ---
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Header Shadow & Back-to-Top Visibility on Scroll ---
    const handleScroll = () => {
        if (header) { header.classList.toggle('scrolled', window.scrollY > 50); }
        if (backToTopButton) { backToTopButton.classList.toggle('visible', window.scrollY > 300); }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    // --- Active Navigation Link Highlighting ---
    const setActiveNavLink = () => {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
        const updateActiveClass = (links) => {
            links.forEach(link => {
                const linkHref = link.getAttribute('href');
                if (!linkHref) return;
                const linkPage = linkHref.substring(linkHref.lastIndexOf('/') + 1) || 'index.html';
                const linkTargetPage = link.dataset.page;
                link.classList.remove('active');
                if (linkPage === currentPage) {
                    link.classList.add('active');
                } else if (currentPage === 'index.html' && linkTargetPage === 'home') {
                    link.classList.add('active');
                }
            });
        };
        updateActiveClass(navLinks);
        updateActiveClass(mobileNavLinks);
    };
    setActiveNavLink();

    // --- Hamburger Menu Toggle ---
    const toggleMobileMenu = () => {
        if (!hamburger || !mobileMenu) return;
        const isActive = hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = isActive ? 'hidden' : '';
        hamburger.setAttribute('aria-expanded', String(isActive));
    };
    const closeMobileMenu = () => {
         if (!hamburger || !mobileMenu) return;
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
    };
    if (hamburger) { hamburger.addEventListener('click', toggleMobileMenu); }
    mobileNavLinks.forEach(link => { link.addEventListener('click', closeMobileMenu); });

    // --- Modal Functionality ---
    const openModal = (title, description, images = [], serviceImage = null, compareImg1 = null, compareImg2 = null, openerElement) => {
        // Get fresh references inside function scope
        const currentCompareContainer = document.getElementById('image-compare-modal-container');
        const currentModalServiceImage = document.getElementById('modal-service-image');
        const currentModalSlideshow = document.getElementById('modal-slideshow');

        if (!modal || !modalTitle || !modalDescription || !currentModalSlideshow || !currentModalServiceImage || !modalCloseButton || !currentCompareContainer) {
            console.error("Modal elements check failed just before opening! Cannot open modal."); return;
        }

        modalTitle.textContent = title;

        // Format description
        const paragraphPlaceholder = '___PARAGRAPH_BREAK___';
        let formattedDescription = description.replace(/\\n\\n/g, paragraphPlaceholder).replace(/\\n/g, '<br>').replace(/\n\n/g, paragraphPlaceholder).replace(/\n/g, '<br>').replace(new RegExp(paragraphPlaceholder, 'g'), '</p><p>');
        modalDescription.innerHTML = `<p>${formattedDescription}</p>`;

        // --- Reset and Display Logic ---
        currentModalServiceImage.style.display = 'none';
        currentModalSlideshow.style.display = 'none';
        currentCompareContainer.style.display = 'none';
        currentModalServiceImage.src = '';
        currentImages = [];

        // Determine Modal Type and Display Content
        if (compareImg1 && compareImg2) { // Priority 1: Comparison Slider
            const topImg = document.getElementById('modal-compare-top-image');
            const bottomImg = document.getElementById('modal-compare-bottom-image');
            currentCompareContainer.style.display = 'block';
            if(topImg) topImg.src = compareImg1; else console.error("compareTopImage element missing");
            if(bottomImg) bottomImg.src = compareImg2; else console.error("compareBottomImage element missing");
            initComparisonSlider_ORIGINAL();
        } else if (images.length > 0) { // Priority 2: Slideshow (from data-images)
            currentImages = images.map(img => img.trim()).filter(img => img); // Already filtered in handleItemClick, but good to be safe
            if (currentImages.length > 0) {
                currentSlideIndex = 0;
                currentModalSlideshow.style.display = 'block';
                updateSlideshow();
            }
        } else if (serviceImage) { // Priority 3: Single Service/Blog Image (from data-image or data-featured-image)
            currentModalServiceImage.src = serviceImage;
            currentModalServiceImage.alt = title;
            currentModalServiceImage.style.display = 'block';
        }
        // If none of the above, modal body will be just title and description

        // Show the modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        elementThatOpenedModal = openerElement;
        modalCloseButton.focus();
    };

    const closeModal = () => {
        const currentCompareTopClipper = document.getElementById('modal-compare-top-clipper');
        const currentCompareSlider = document.getElementById('modal-compare-slider');

        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        removeComparisonSliderListeners_ORIGINAL();
        if(currentCompareTopClipper && currentCompareSlider) {
            currentCompareTopClipper.style.width = '50%';
            currentCompareSlider.style.left = '50%';
        }
        if (elementThatOpenedModal && typeof elementThatOpenedModal.focus === 'function') {
            elementThatOpenedModal.focus();
        }
        elementThatOpenedModal = null;
    };

    // --- Portfolio Slideshow Logic ---
    const updateSlideshow = () => {
        if (!modalSlideshowImage || !slideCounter || !slidePrevButton || !slideNextButton || currentImages.length === 0) return;

        // Preload next and previous images for smoother transitions
        if (currentImages.length > 1) {
            const nextIndex = (currentSlideIndex + 1) % currentImages.length;
            const prevIndex = (currentSlideIndex - 1 + currentImages.length) % currentImages.length;
            new Image().src = currentImages[nextIndex];
            new Image().src = currentImages[prevIndex];
        }

        modalSlideshowImage.src = currentImages[currentSlideIndex];
        modalSlideshowImage.alt = `${modalTitle.textContent || 'Project'} - Image ${currentSlideIndex + 1}`;
        slideCounter.textContent = `${currentSlideIndex + 1} / ${currentImages.length}`;

        const showControls = currentImages.length > 1;
        slidePrevButton.style.display = showControls ? 'block' : 'none';
        slideNextButton.style.display = showControls ? 'block' : 'none';
        slideCounter.style.display = showControls ? 'block' : 'none';
    };
    const showNextSlide = () => { if (currentImages.length <= 1) return; currentSlideIndex = (currentSlideIndex + 1) % currentImages.length; updateSlideshow(); };
    const showPrevSlide = () => { if (currentImages.length <= 1) return; currentSlideIndex = (currentSlideIndex - 1 + currentImages.length) % currentImages.length; updateSlideshow(); };

    // =========================================================================
    // === START: Image Comparison Slider Logic (COPIED FROM ORIGINAL SCRIPT) ===
    // =========================================================================
    const moveCompareSlider_ORIGINAL = (clientX) => {
        const container = document.getElementById('image-compare-modal-container');
        const clipper = document.getElementById('modal-compare-top-clipper');
        const slider = document.getElementById('modal-compare-slider');
        if (!container || !clipper || !slider) return;
        const rect = container.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percentage = (x / rect.width) * 100;
        clipper.style.width = `${percentage}%`;
        slider.style.left = `${percentage}%`;
        clipper.style.borderTopRightRadius = percentage > 99 ? 'var(--border-radius)' : '0px';
        clipper.style.borderBottomRightRadius = percentage > 99 ? 'var(--border-radius)' : '0px';
        clipper.style.borderTopLeftRadius = percentage < 1 ? '0px' : 'var(--border-radius)';
        clipper.style.borderBottomLeftRadius = percentage < 1 ? '0px' : 'var(--border-radius)';
    };
    const startCompareDrag_ORIGINAL = (e) => {
        isCompareDragging = true;
        document.body.classList.add('dragging-no-select');
        const container = document.getElementById('image-compare-modal-container');
        if(container) container.style.cursor = 'ew-resize';
        if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
        let clientX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
        moveCompareSlider_ORIGINAL(clientX);
    };
    const compareDrag_ORIGINAL = (e) => {
        if (!isCompareDragging) return;
        let clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
        if (e.type === 'touchmove' && e.cancelable) e.preventDefault();
        moveCompareSlider_ORIGINAL(clientX);
    };
    const stopCompareDrag_ORIGINAL = () => {
        if (isCompareDragging) {
            isCompareDragging = false;
            document.body.classList.remove('dragging-no-select');
            const container = document.getElementById('image-compare-modal-container');
            if(container) container.style.cursor = 'ew-resize';
        }
    };
    const addComparisonSliderListeners_ORIGINAL = () => {
        const slider = document.getElementById('modal-compare-slider');
        const container = document.getElementById('image-compare-modal-container');
        if (!slider) { console.error("Cannot add comparison slider listeners: slider missing."); return; }
        slider.addEventListener('mousedown', startCompareDrag_ORIGINAL);
        slider.addEventListener('touchstart', startCompareDrag_ORIGINAL, { passive: false });
        window.addEventListener('mousemove', compareDrag_ORIGINAL);
        window.addEventListener('touchmove', compareDrag_ORIGINAL, { passive: false });
        window.addEventListener('mouseup', stopCompareDrag_ORIGINAL);
        window.addEventListener('touchend', stopCompareDrag_ORIGINAL);
        if(container) {
             container.addEventListener('mousedown', startCompareDrag_ORIGINAL);
             container.addEventListener('touchstart', startCompareDrag_ORIGINAL, { passive: false });
         }
    };
    const removeComparisonSliderListeners_ORIGINAL = () => {
        const slider = document.getElementById('modal-compare-slider');
        const container = document.getElementById('image-compare-modal-container');
        if (slider) {
             slider.removeEventListener('mousedown', startCompareDrag_ORIGINAL);
             slider.removeEventListener('touchstart', startCompareDrag_ORIGINAL);
        }
        window.removeEventListener('mousemove', compareDrag_ORIGINAL);
        window.removeEventListener('touchmove', compareDrag_ORIGINAL);
        window.removeEventListener('mouseup', stopCompareDrag_ORIGINAL);
        window.removeEventListener('touchend', stopCompareDrag_ORIGINAL);
        if(container) {
             container.removeEventListener('mousedown', startCompareDrag_ORIGINAL);
             container.removeEventListener('touchstart', startCompareDrag_ORIGINAL);
         }
    };
    const adjustCompareImageDimensions_ORIGINAL = () => {
        const container = document.getElementById('image-compare-modal-container');
        const topImage = document.getElementById('modal-compare-top-image');
        const bottomImage = document.getElementById('modal-compare-bottom-image');
        const clipper = document.getElementById('modal-compare-top-clipper');
        const slider = document.getElementById('modal-compare-slider');
        if (!container || !topImage || !bottomImage) { console.error("Cannot adjust dimensions: Required elements missing."); return; }
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        if (containerWidth === 0 || containerHeight === 0) return;
        const containerRatio = containerWidth / containerHeight;
        [topImage, bottomImage].forEach((img, index) => {
            if (img.naturalWidth && img.naturalHeight) {
                const imgRatio = img.naturalWidth / img.naturalHeight;
                img.style.width = ''; img.style.height = '';
                img.style.position = 'absolute'; img.style.maxWidth = 'none'; img.style.maxHeight = 'none';
                img.style.objectFit = '';
                let calculatedWidth, calculatedHeight;
                if (imgRatio > containerRatio) { calculatedHeight = containerHeight; calculatedWidth = containerHeight * imgRatio; }
                else { calculatedWidth = containerWidth; calculatedHeight = containerWidth / imgRatio; }
                img.style.width = `${calculatedWidth}px`; img.style.height = `${calculatedHeight}px`;
                img.style.top = '0px'; img.style.left = '0px';
            } else {
                 img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
                 img.style.position = 'absolute'; img.style.top = '0'; img.style.left = '0';
            }
        });
        if(clipper && slider) { clipper.style.width = '50%'; slider.style.left = '50%'; }
    };
    const onCompareImageLoad_ORIGINAL = () => { compareImagesLoadedCount++; if (compareImagesLoadedCount >= 2) { adjustCompareImageDimensions_ORIGINAL(); } };
    const initComparisonSlider_ORIGINAL = () => {
        const topImage = document.getElementById('modal-compare-top-image');
        const bottomImage = document.getElementById('modal-compare-bottom-image');
        compareImagesLoadedCount = 0;
         [topImage, bottomImage].forEach(img => {
            if (!img) return;
            img.removeEventListener('load', onCompareImageLoad_ORIGINAL);
            img.removeEventListener('error', onCompareImageLoad_ORIGINAL);
            if (img.complete && img.naturalWidth > 0) { onCompareImageLoad_ORIGINAL(); }
            else {
                img.addEventListener('load', onCompareImageLoad_ORIGINAL);
                img.addEventListener('error', () => { console.error("Compare Img Error:", img.src); onCompareImageLoad_ORIGINAL(); });
            }
        });
        addComparisonSliderListeners_ORIGINAL();
        if (compareImagesLoadedCount >= 2) { adjustCompareImageDimensions_ORIGINAL(); }
    };
    // =======================================================================
    // === END: Image Comparison Slider Logic (COPIED FROM ORIGINAL SCRIPT) ===
    // =======================================================================


    // --- Attaching Event Listeners ---

    // Function to handle modal opening for different item types
    const handleItemClick = (item, type, event) => {
        event.preventDefault(); // Prevent default action (like link navigation)

        const title = item.dataset.title || 'Details';
        let rawDescription = 'No description available.';
        let serviceImage = null; // For data-image or data-featured-image
        let imagesString = '';   // For data-images (slideshow)
        let compareImg1 = null;
        let compareImg2 = null;
        let locationText = '';

        // Extract data attributes based on item type
        if (type === 'blog') {
            rawDescription = item.dataset.fullContent || rawDescription;
            serviceImage = item.dataset.featuredImage || null; // Blog uses featuredImage for single display
        } else { // Services and Portfolio
            rawDescription = item.dataset.description || rawDescription;
            // For services/portfolio: data-images for slideshow, data-image for single
            imagesString = item.dataset.images || '';
            if (!imagesString) { // If no data-images, check for data-image (for single display)
                serviceImage = item.dataset.image || null;
            }
            compareImg1 = item.dataset.compareImg1 || null;
            compareImg2 = item.dataset.compareImg2 || null;
            locationText = item.dataset.location ? `<strong>Location:</strong> ${item.dataset.location}\\n\\n` : '';
        }

        const images = imagesString ? imagesString.split(',').map(img => img.trim()).filter(img => img) : [];

        // Open the modal with extracted data
        // The openModal function will prioritize comparison, then slideshow (images array), then single serviceImage
        openModal(title, locationText + rawDescription, images, serviceImage, compareImg1, compareImg2, event.currentTarget);
    };

    // Attach listeners to service items
    if (serviceItems.length > 0) {
        serviceItems.forEach(item => {
            item.addEventListener('click', (e) => handleItemClick(item, 'service', e));
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { handleItemClick(item, 'service', e); } });
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
        });
    } else { console.warn("No service items found."); }

    // Attach listeners to portfolio items
    if (portfolioItems.length > 0) {
        portfolioItems.forEach(item => {
            item.addEventListener('click', (e) => handleItemClick(item, 'portfolio', e));
            item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { handleItemClick(item, 'portfolio', e); } });
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
        });
    } else { console.warn("No portfolio items found."); }

    // Attach listeners to blog read more buttons
    if (blogReadMoreButtons.length > 0) {
        blogReadMoreButtons.forEach(button => {
            const parentArticle = button.closest('.blog-post-summary');
            if (!parentArticle) {
                console.warn("Could not find parent article for button:", button);
                return; // Skip this button if structure is wrong
            }
            button.addEventListener('click', (e) => handleItemClick(parentArticle, 'blog', e));
            button.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { handleItemClick(parentArticle, 'blog', e); } });
            button.setAttribute('tabindex', '0');
        });
    } else { console.warn("No blog read more buttons found."); }


    // --- Modal Closing & Slideshow Interaction Listeners ---
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (modal?.classList.contains('active')) {
            if (e.key === 'Escape') closeModal();
            if (modalSlideshow?.style.display !== 'none' && currentImages.length > 1) {
                if (e.key === 'ArrowRight') showNextSlide();
                else if (e.key === 'ArrowLeft') showPrevSlide();
            }
        }
    });
    if (slideNextButton) slideNextButton.addEventListener('click', showNextSlide);
    if (slidePrevButton) slidePrevButton.addEventListener('click', showPrevSlide);

    const handleTouchStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
    const handleTouchEnd = (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipeGesture(); };
    const handleSwipeGesture = () => {
        if (modalSlideshow?.style.display !== 'none' && currentImages.length > 1 && modal?.classList.contains('active')) {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) showNextSlide();
            else if (touchEndX > touchStartX + swipeThreshold) showPrevSlide();
        }
        touchStartX = 0; touchEndX = 0;
    };
    if (modalSlideshow) {
        modalSlideshow.addEventListener('touchstart', handleTouchStart, { passive: true });
        modalSlideshow.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // --- Contact Form Validation & Handling ---
    if (form) {
        const requiredFields = form.querySelectorAll('[required]');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;
            formStatus.textContent = ''; formStatus.style.color = '';
            form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    const label = field.closest('.form-group')?.querySelector('label');
                    const fieldName = label ? label.textContent.replace('*', '').trim() : 'This field';
                    showError(field, `${fieldName} is required.`);
                } else if (field.type === 'email' && !isValidEmail(field.value.trim())) {
                    isValid = false; showError(field, 'Please enter a valid email address.');
                }
            });
            const honeypot = form.querySelector('.honeypot input');
            if (honeypot && honeypot.value) { isValid = false; console.log("Honeypot triggered."); }
            if (isValid) {
                formStatus.textContent = 'Sending... (Simulation - Requires Backend)'; formStatus.style.color = 'green';
                console.log('Form is valid, simulating submission...');
                setTimeout(() => {
                    if (formStatus.textContent.includes('Sending')) {
                         formStatus.textContent = 'Message Sent! (Simulation)';
                         form.reset();
                    }
                }, 1500);
            } else {
                formStatus.textContent = 'Please correct the errors above.'; formStatus.style.color = 'var(--danger-red)';
                form.querySelector('.error')?.focus();
            }
        });
    }
    function showError(inputElement, message) { const formGroup=inputElement.closest('.form-group');if(formGroup){inputElement.classList.add('error');const errorElement=formGroup.querySelector('.error-message');if(errorElement){errorElement.textContent=message;}} }
    function isValidEmail(email) { const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return regex.test(email); }

    // --- Back to Top Button Smooth Scroll ---
    if (backToTopButton) {
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- FAQ Accordion Logic (UPDATED) ---
    if (faqItems.length > 0) {
        faqItems.forEach(item => { // item is a <details> element
            const summary = item.querySelector('summary.faq-question');
            if (summary) {
                summary.addEventListener('click', function(event) {
                    // 'item' (the <details> element) is in the scope from the forEach loop.
                    const clickedItem = item;

                    // If the clicked item is currently closed (it's about to be opened by this click)
                    // The 'open' attribute is not yet set by the browser at the point of 'click' event
                    // on summary if it was previously closed. So we check its current state.
                    // If it's closed, this click will open it.
                    if (!clickedItem.open) {
                        // Close all other FAQ items
                        faqItems.forEach(otherItem => {
                            if (otherItem !== clickedItem) {
                                otherItem.removeAttribute('open');
                            }
                        });
                    }
                    // We don't need to manually set 'open' or 'removeAttribute('open')' on clickedItem here.
                    // The default browser behavior for clicking a <summary> element will
                    // toggle the 'open' attribute of its parent <details> element.
                    // If we were to event.preventDefault(), then we would need to manage it.
                });
            }
        });
    }

}); // End DOMContentLoaded
