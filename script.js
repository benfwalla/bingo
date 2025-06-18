document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const titleInput = document.getElementById('title');
    const freeSpaceCheckbox = document.getElementById('freeSpace');
    const cardCountInput = document.getElementById('cardCount');
    const downloadBtn = document.getElementById('downloadBtn');
    const cardPreview = document.getElementById('cardPreview');
    
    // Current card data
    let currentCardData = null;
    
    // Initialize preview
    generatePreview(true); // true means generate new card numbers
    
    // Add event listeners for real-time preview updates
    titleInput.addEventListener('input', function() {
        // Only update the title, not the card numbers
        updatePreviewTitle();
    });
    
    // Only regenerate the entire card when the free space option changes
    freeSpaceCheckbox.addEventListener('change', function() {
        generatePreview(true); // true means generate new card numbers
    });
    
    // Download button event listener
    downloadBtn.addEventListener('click', generatePDF);
    
    /**
     * Update only the title in the preview without regenerating the card numbers
     */
    function updatePreviewTitle() {
        const title = titleInput.value || 'BINGO';
        const headerElement = cardPreview.querySelector('.header');
        
        if (headerElement) {
            headerElement.textContent = title;
        }
    }
    
    /**
     * Generate and display a preview bingo card
     * @param {boolean} regenerateNumbers - Whether to generate new card numbers
     */
    function generatePreview(regenerateNumbers = false) {
        const title = titleInput.value || 'BINGO';
        const includeFreeSpace = freeSpaceCheckbox.checked;
        
        // Generate a single card for preview or use existing one
        if (regenerateNumbers || !currentCardData) {
            currentCardData = generateBingoCard(includeFreeSpace);
        }
        
        // Clear the preview
        cardPreview.innerHTML = '';
        
        // Add title/header
        const header = document.createElement('div');
        header.className = 'header';
        header.textContent = title;
        cardPreview.appendChild(header);
        
        // Add B-I-N-G-O letters as column headers
        const letters = ['B', 'I', 'N', 'G', 'O'];
        letters.forEach(letter => {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'letter';
            letterDiv.textContent = letter;
            cardPreview.appendChild(letterDiv);
        });
        
        // Add the numbers to the card
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Check if this is the free space
                if (includeFreeSpace && row === 2 && col === 2) {
                    cell.classList.add('free-space');
                    cell.textContent = 'FREE';
                } else {
                    cell.textContent = currentCardData[row][col];
                }
                
                cardPreview.appendChild(cell);
            }
        }
    }
    
    /**
     * Generate a unique bingo card
     * @param {boolean} includeFreeSpace - Whether to include a free space in the center
     * @returns {Array} 2D array representing the bingo card
     */
    function generateBingoCard(includeFreeSpace) {
        // Initialize empty card
        const card = Array(5).fill().map(() => Array(5).fill(0));
        
        // Define ranges for each column (B: 1-15, I: 16-30, etc.)
        const ranges = [
            { min: 1, max: 15 },   // B
            { min: 16, max: 30 },  // I
            { min: 31, max: 45 },  // N
            { min: 46, max: 60 },  // G
            { min: 61, max: 75 }   // O
        ];
        
        // Generate numbers for each column
        for (let col = 0; col < 5; col++) {
            // Get 5 unique random numbers for this column
            const columnNumbers = getUniqueRandomNumbers(
                ranges[col].min,
                ranges[col].max,
                5
            );
            
            // Assign numbers to card
            for (let row = 0; row < 5; row++) {
                card[row][col] = columnNumbers[row];
            }
        }
        
        // Set free space if needed
        if (includeFreeSpace) {
            card[2][2] = 'FREE';
        }
        
        return card;
    }
    
    /**
     * Generate multiple unique bingo cards
     * @param {number} count - Number of cards to generate
     * @param {boolean} includeFreeSpace - Whether to include free space
     * @returns {Array} Array of bingo cards
     */
    function generateMultipleCards(count, includeFreeSpace) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(generateBingoCard(includeFreeSpace));
        }
        return cards;
    }
    
    /**
     * Get unique random numbers within a range
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @param {number} count - How many numbers to generate
     * @returns {Array} Array of unique random numbers
     */
    function getUniqueRandomNumbers(min, max, count) {
        // Create array with all possible numbers in the range
        const numbers = [];
        for (let i = min; i <= max; i++) {
            numbers.push(i);
        }
        
        // Shuffle array using Fisher-Yates algorithm
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        // Return first 'count' elements
        return numbers.slice(0, count);
    }
    
    /**
     * Generate PDF with the specified number of bingo cards
     */
    function generatePDF() {
        const title = titleInput.value || 'BINGO';
        const cardCount = parseInt(cardCountInput.value) || 1;
        const includeFreeSpace = freeSpaceCheckbox.checked;
        
        // Load Asap Regular and Bold TTF fonts
        Promise.all([
            fetch('fonts/Asap-Regular.ttf').then(response => response.arrayBuffer()),
            fetch('fonts/Asap-Bold.ttf').then(response => response.arrayBuffer())
        ])
            .then(([regularFontBuffer, boldFontBuffer]) => {
                // Convert Regular TTF to base64
                const regularFontBytes = new Uint8Array(regularFontBuffer);
                let regularBinary = '';
                for (let i = 0; i < regularFontBytes.byteLength; i++) {
                    regularBinary += String.fromCharCode(regularFontBytes[i]);
                }
                const regularFontBase64 = window.btoa(regularBinary);
                
                // Convert Bold TTF to base64
                const boldFontBytes = new Uint8Array(boldFontBuffer);
                let boldBinary = '';
                for (let i = 0; i < boldFontBytes.byteLength; i++) {
                    boldBinary += String.fromCharCode(boldFontBytes[i]);
                }
                const boldFontBase64 = window.btoa(boldBinary);
                
                // Create multiple cards
                const cards = generateMultipleCards(cardCount, includeFreeSpace);
                
                // Use jsPDF to create PDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm'
                });
                
                // Add the fonts to the PDF
                doc.addFileToVFS('Asap-Regular.ttf', regularFontBase64);
                doc.addFont('Asap-Regular.ttf', 'Asap', 'normal');
                
                doc.addFileToVFS('Asap-Bold.ttf', boldFontBase64);
                doc.addFont('Asap-Bold.ttf', 'Asap', 'bold');
                
                // Define card dimensions
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 10; // mm
                const cardWidth = pageWidth - (margin * 2);
                const cellSize = cardWidth / 5;
                
                // Import QR code and logo images
                const qrImg = 'img/app-qr.png';
                const logoImg = 'img/kibu-bw.png';
                
                // Generate pages with cards
                const letters = ['B', 'I', 'N', 'G', 'O'];
                
                cards.forEach((card, cardIndex) => {
                    // Add a new page for each card except the first one
                    if (cardIndex > 0) {
                        doc.addPage();
                    }
                    
                    // Set title font and add title (bold) - moved up for more spacing
                    doc.setFontSize(24);
                    doc.setFont('Asap', 'bold');
                    doc.text(title, pageWidth / 2, margin + 8, { align: 'center' });
                    
                    // Add B-I-N-G-O letters (bold) - moved down for more spacing
                    doc.setFontSize(20); // Increased from 16 to 20
                    // Keep bold font for letters
                    letters.forEach((letter, i) => {
                        const x = margin + (i * cellSize) + (cellSize / 2);
                        const y = margin + 25; // Increased from 20 to 25 to add more space
                        doc.text(letter, x, y, { align: 'center' });
                    });
                    
                    // Position the grid 5mm lower to match the new BINGO position
                    const gridStartY = margin + 30; // Increased from 25 to 30
                    
                    // Draw the card border (thicker)
                    doc.setLineWidth(1);
                    doc.rect(margin, gridStartY, cardWidth, cardWidth);
                    
                    // Reset line width for grid lines
                    doc.setLineWidth(0.5);
                    
                    // Draw horizontal grid lines
                    for (let i = 1; i < 5; i++) {
                        const y = gridStartY + (i * cellSize);
                        doc.line(margin, y, margin + cardWidth, y);
                    }
                    
                    // Draw vertical grid lines
                    for (let i = 1; i < 5; i++) {
                        const x = margin + (i * cellSize);
                        doc.line(x, gridStartY, x, gridStartY + cardWidth);
                    }
                    
                    // Add numbers (bold)
                    doc.setFontSize(18); // Increased from 14 to 18
                    doc.setFont('Asap', 'bold'); // Set bold font for numbers
                    for (let row = 0; row < 5; row++) {
                        for (let col = 0; col < 5; col++) {
                            const x = margin + (col * cellSize) + (cellSize / 2);
                            const y = gridStartY + (row * cellSize) + (cellSize / 2) + 2;
                            
                            let cellValue = card[row][col];
                            
                            // Style the free space
                            if (cellValue === 'FREE') {
                                // Draw filled rectangle for free space - using blue (#328CF8)
                                doc.setFillColor(50, 140, 248); // RGB for #328CF8
                                doc.rect(
                                    margin + (col * cellSize),
                                    gridStartY + (row * cellSize),
                                    cellSize,
                                    cellSize,
                                    'F'
                                );
                                
                                // Add border back
                                doc.setDrawColor(0);
                                doc.rect(
                                    margin + (col * cellSize),
                                    gridStartY + (row * cellSize),
                                    cellSize,
                                    cellSize
                                );
                                
                                // Make text white for free space
                                doc.setTextColor(255, 255, 255);
                            }
                            
                            doc.text(String(cellValue), x, y, { align: 'center' });
                            
                            // Reset text color for regular cells
                            if (cellValue === 'FREE') {
                                doc.setTextColor(0, 0, 0);
                            }
                        }
                    }
                    
                    // Reset font and add card number if needed
                    if (cardCount > 1) {
                        doc.setFont('Asap', 'normal');
                        doc.setFontSize(10);
                        doc.text(`Card ${cardIndex + 1} of ${cardCount}`, pageWidth / 2, gridStartY + cardWidth + 10, { align: 'center' });
                    }
                    
                    // Add footer line with more space below the grid
                    const footerY = pageHeight - 25; // Keep footer at bottom of page
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(margin, footerY, pageWidth - margin, footerY);
                    
                    // Add QR code to bottom left - aligned with logo height
                    try {
                        const qrHeight = 15;
                        // Calculate center points to ensure perfect alignment
                        const logoY = pageHeight - 20;
                        const logoCenter = logoY + (7.5 / 2);
                        const qrY = logoCenter - (qrHeight / 2);
                        
                        doc.addImage(qrImg, 'PNG', margin, qrY, qrHeight, qrHeight);
                        // No text under QR code as requested
                    } catch (e) {
                        console.error('Could not add QR code to PDF', e);
                    }
                    
                    // Add logo to bottom right - maintain aspect ratio
                    try {
                        // Known dimensions: 723 × 306
                        const logoAspectRatio = 723 / 306; // width / height
                        
                        // Set logo size
                        const logoHeight = 7.5; // Match height to previous setting
                        const logoWidth = logoHeight * logoAspectRatio; // Calculate width based on aspect ratio
                        
                        // Position the logo in the bottom right, aligned with QR code height
                        doc.addImage(logoImg, 'PNG', 
                            pageWidth - margin - logoWidth, 
                            pageHeight - 20, // Use same y-position as before
                            logoWidth, 
                            logoHeight);
                    } catch (e) {
                        console.error('Could not add logo to PDF', e);
                    }
                });
                
                // Save the PDF
                doc.save(`${title}-Bingo-Cards.pdf`);
            })
            .catch(err => {
                console.error('Error loading font:', err);
                alert('Could not load the Asap font. Please try again.');
            });
    }
});
