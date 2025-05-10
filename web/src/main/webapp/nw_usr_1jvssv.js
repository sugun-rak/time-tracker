// 1. Global State & Constants
let selectedOption = 'bus-stop';
let activeTicket = null;
let archivedTickets = [];
let allTickets = []; // New array to store all tickets
let bookingStep = 1; // Track booking step
let selectedBookingLocation = null;
let selectedBookingType = null;
let currentStep = 0;
let isInitialized = false;

// Global state management
const totalSteps = 4;
const SCREENS = {
    HOME: 'home',
    BOOKING_FORM: 'bookingForm',
    BOOKING_STEP: 'bookingStep',
    BUS_LIST: 'busList',
    TICKET_SECTION: 'ticketSection',
    ARCHIVE_SECTION: 'archiveSection'
};

// Load saved state from localStorage
function loadSavedState() {
    try {
        const savedTickets = localStorage.getItem('allTickets');
        const savedArchived = localStorage.getItem('archivedTickets');
        if (savedTickets) allTickets = JSON.parse(savedTickets);
        if (savedArchived) archivedTickets = JSON.parse(savedArchived);
    } catch (error) {
        console.error('Error loading saved state:', error);
    }
}

// Save state to localStorage
function saveState() {
    try {
        localStorage.setItem('allTickets', JSON.stringify(allTickets));
        localStorage.setItem('archivedTickets', JSON.stringify(archivedTickets));
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

// Initialize app with proper error handling and state management
function initializeApp() {
    try {
        if (isInitialized) {
            console.warn('App already initialized');
            return;
        }

        // Load saved state
        loadSavedState();

        // Initialize screens
        const welcomeSection = document.querySelector('.welcome-section');
        const bookingStep = document.querySelector('.booking-step');
        const mainNav = document.getElementById('mainNav');
        const homeScreen = document.getElementById('home');

        if (!homeScreen) {
            throw new Error('Required home screen element not found');
        }

        // Reset all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });

        // Set up welcome screen
        if (welcomeSection) welcomeSection.style.display = 'block';
        if (bookingStep) bookingStep.style.display = 'none';
        homeScreen.classList.add('active');
        homeScreen.style.display = '';

        // Initialize navigation with error checking
        if (mainNav) {
            mainNav.innerHTML = `
                <div class="nav-container">
                    <div class="nav-links">
                        <button class="nav-link home-btn" onclick="goHome()" title="Back to Home">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 20v-6h4v6m5-8.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7.5M19 10.5l-7-7-7 7" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="nav-link" onclick="showScreen('${SCREENS.BOOKING_FORM}')">New Booking</button>
                        <button class="nav-link" onclick="showScreen('${SCREENS.BUS_LIST}')">Buses</button>
                        <button class="nav-link" onclick="showScreen('${SCREENS.TICKET_SECTION}')">Tickets</button>
                        <button class="nav-link" onclick="showScreen('${SCREENS.ARCHIVE_SECTION}')">Archive</button>
                        <button class="nav-link exit-btn" onclick="exitApp()">Exit</button>
                    </div>
                </div>
            `;
            mainNav.style.display = 'none';
        } else {
            console.warn('Navigation bar element not found');
        }

        // Initialize state
        currentStep = 0;
        selectedOption = 'bus-stop';
        selectedBookingLocation = null;
        selectedBookingType = null;

        // Initialize map if available
        if (typeof MapmyIndia !== 'undefined') {
            initMap();
        } else {
            console.warn('MapmyIndia not available, map features will be disabled');
        }

        // Initialize booking options
        selectBookingOption('bus-stop');
        
        // Initialize navigation state
        updateNavigationButtons();
        
        // Set up auto-save
        window.addEventListener('beforeunload', saveState);
        
        // Set up periodic state saving
        setInterval(saveState, 30000); // Save every 30 seconds
        
        console.log('App initialized successfully');
        isInitialized = true;
    } catch (error) {
        console.error('Critical error initializing app:', error);
        alert('There was an error starting the application. Please refresh the page.');
    }
}

// 2. Utility Functions
function showScreen(screenId) {
    try {
        if (!screenId || !SCREENS[Object.keys(SCREENS).find(key => SCREENS[key] === screenId)]) {
            throw new Error(`Invalid screen ID: ${screenId}`);
        }

        if (!isInitialized) {
            console.warn('App not fully initialized, initializing now...');
            initializeApp();
        }

        // Save current screen for history
        const previousScreen = document.querySelector('.screen.active')?.id;

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });

        // Show selected screen
        const targetScreen = document.getElementById(screenId);
        if (!targetScreen) {
            throw new Error(`Screen element not found: ${screenId}`);
        }

        targetScreen.classList.add('active');
        targetScreen.style.display = '';

        // Update navigation for the current screen
        updateActiveNavLink(screenId);
        
        const mainNav = document.getElementById('mainNav');
        if (!mainNav) {
            console.warn('Navigation bar not found');
        } else {
            // Handle navigation visibility
            if (screenId === SCREENS.BOOKING_STEP || screenId === SCREENS.HOME) {
                mainNav.style.display = 'none';
            } else {
                if (!mainNav.querySelector('.nav-container')) {
                    mainNav.innerHTML = `
                        <div class="nav-container">
                            <div class="nav-links">
                                <button class="nav-link home-btn" onclick="goHome()" title="Back to Home">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 20v-6h4v6m5-8.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7.5M19 10.5l-7-7-7 7" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <button class="nav-link" onclick="showScreen('${SCREENS.BOOKING_FORM}')">New Booking</button>
                                <button class="nav-link" onclick="showScreen('${SCREENS.BUS_LIST}')">Buses</button>
                                <button class="nav-link" onclick="showScreen('${SCREENS.TICKET_SECTION}')">Tickets</button>
                                <button class="nav-link" onclick="showScreen('${SCREENS.ARCHIVE_SECTION}')">Archive</button>
                                <button class="nav-link exit-btn" onclick="exitApp()">Exit</button>
                            </div>
                        </div>
                    `;
                }
                mainNav.style.display = 'block';
                mainNav.style.opacity = '1';
                mainNav.style.visibility = 'visible';
            }
        }

        // Initialize specific screen functionality
        try {
            switch (screenId) {
                case SCREENS.BOOKING_FORM:
                    initializeBookingForm();
                    break;
                case SCREENS.TICKET_SECTION:
                    showAllTickets();
                    break;
                case SCREENS.BUS_LIST:
                    showAllBuses();
                    break;
                case SCREENS.ARCHIVE_SECTION:
                    showArchivedTickets();
                    break;
                case SCREENS.BOOKING_STEP:
                    showBookingStep();
                    break;
            }
        } catch (error) {
            console.error(`Error initializing screen ${screenId}:`, error);
            // Don't throw here - we still want to show the screen even if initialization fails
        }
        
        // Update navigation state
        updateNavigationButtons();
        
        // Save screen transition in history if appropriate
        if (previousScreen && screenId !== SCREENS.HOME) {
            try {
                const state = { screen: screenId };
                const title = `CityBus - ${screenId}`;
                const url = `#${screenId}`;
                window.history.pushState(state, title, url);
            } catch (error) {
                console.warn('Error updating browser history:', error);
            }
        }
        
        console.log(`Screen changed to: ${screenId}`);
    } catch (error) {
        console.error('Error showing screen:', error);
        alert('There was an error changing screens. Please try again.');
        // Try to recover by showing home screen
        try {
            const homeScreen = document.getElementById(SCREENS.HOME);
            if (homeScreen) {
                homeScreen.classList.add('active');
                homeScreen.style.display = '';
            }
        } catch (recoveryError) {
            console.error('Failed to recover to home screen:', recoveryError);
        }
    }
}

// Update active navigation link
function updateActiveNavLink(screenId) {
    try {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const onclickAttr = link.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(screenId)) {
                link.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error updating active navigation link:', error);
    }
}

// Update navigation buttons with error handling
function updateNavigationButtons() {
    try {
        const busListLink = document.querySelector('.nav-link[onclick*="busList"]');
        const ticketLink = document.querySelector('.nav-link[onclick*="ticketSection"]');
        const archiveLink = document.querySelector('.nav-link[onclick*="archiveSection"]');

        if (busListLink) {
            const fromLocation = document.getElementById('fromLocation');
            const toLocation = document.getElementById('toLocation');
            const hasValidRoute = fromLocation && toLocation && 
                                fromLocation.value && toLocation.value;
            
            busListLink.style.opacity = hasValidRoute ? '1' : '0.5';
            busListLink.style.pointerEvents = hasValidRoute ? 'auto' : 'none';
            busListLink.title = hasValidRoute ? 'View available buses' : 'Please select route first';
        }

        if (ticketLink) {
            const hasAnyTickets = allTickets.length > 0 || archivedTickets.length > 0;
            ticketLink.style.opacity = hasAnyTickets ? '1' : '0.5';
            ticketLink.style.pointerEvents = hasAnyTickets ? 'auto' : 'none';
            ticketLink.title = hasAnyTickets ? 'View your tickets' : 'No tickets available';
        }

        if (archiveLink) {
            archiveLink.style.opacity = archivedTickets.length > 0 ? '1' : '0.5';
            archiveLink.style.pointerEvents = archivedTickets.length > 0 ? 'auto' : 'none';
            archiveLink.title = archivedTickets.length > 0 ? 'View archived tickets' : 'No archived tickets';
        }
    } catch (error) {
        console.error('Error updating navigation buttons:', error);
    }
}

// Map functionality
let map;
let marker;
let currentLocationField;
let searchBox;
let selectedLocation = null;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeApp();
        
        // Add window unload handler
        window.addEventListener('beforeunload', function(e) {
            if (allTickets.length > 0 || archivedTickets.length > 0) {
                e.preventDefault();
                e.returnValue = 'You have active tickets. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
        
        // Add error boundary
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
            return false;
        };
        
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
    }
});

// Initialize map
function initMap() {
    try {
        // Default to a central location in India (e.g., New Delhi)
        const defaultLocation = { lat: 28.6139, lng: 77.2090 };
        
        // Initialize the map with required options
        map = new MapmyIndia.Map('map', {
            center: defaultLocation,
            zoomControl: true,
            hybrid: true,
            search: true,
            traffic: true,
            zoom: 12
        });

        // Add search box with autocomplete
        const searchBox = new MapmyIndia.SearchBox(document.getElementById('mapSearchInput'), {
            map: map,
            searchBoxCallback: function(results, status) {
                if (status === 'OK') {
                    const place = results[0];
                    if (place) {
                        map.setCenter(place.geometry.location);
                        map.setZoom(15);
                        updateMarker(place.geometry.location, place.formatted_address);
                    }
                }
            }
        });

        // Add click listener to map
        map.addListener('click', function(e) {
            updateMarker(e.latLng);
        });

        // Initialize geocoder
        const geocoder = new MapmyIndia.Geocoder();

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Show map modal
window.showMap = function(field) {
    try {
        currentLocationField = field;
        document.getElementById('mapModal').style.display = 'flex';
        
        // Initialize map if not already initialized
        if (!map) {
            initMap();
        }

        // Center map on user's current location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    map.setZoom(15);
                },
                () => {
                    // If geolocation fails, center on default location
                    map.setCenter({ lat: 28.6139, lng: 77.2090 });
                }
            );
        }
    } catch (error) {
        console.error('Error showing map:', error);
        alert('Error loading map. Please try again.');
    }
};

// Close map modal
window.closeMap = function() {
    document.getElementById('mapModal').style.display = 'none';
    selectedLocation = null;
};

// Update marker on map
function updateMarker(location, address = null) {
    if (marker) {
        marker.setMap(null);
    }

    marker = new MapmyIndia.Marker({
        position: location,
        map: map,
        animation: MapmyIndia.Animation.DROP,
        draggable: true
    });

    // Add drag end listener
    marker.addListener('dragend', function() {
        const position = marker.getPosition();
        // Reverse geocode the new position
        const geocoder = new MapmyIndia.Geocoder();
        geocoder.geocode({ location: position }, function(results, status) {
            if (status === 'OK' && results[0]) {
                selectedLocation = {
                    lat: position.lat,
                    lng: position.lng,
                    address: results[0].formatted_address
                };
            }
        });
    });

    selectedLocation = {
        lat: location.lat,
        lng: location.lng,
        address: address
    };
}

// Search location
window.searchLocation = function() {
    const input = document.getElementById('mapSearchInput');
    const geocoder = new MapmyIndia.Geocoder();

    geocoder.geocode({ address: input.value }, function(results, status) {
        if (status === 'OK') {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(15);
            updateMarker(location, results[0].formatted_address);
        } else {
            alert('Location not found. Please try a different search term.');
        }
    });
};

// Confirm selected location
window.confirmLocation = function() {
    if (!selectedLocation) {
        alert('Please select a location on the map first.');
        return;
    }

    // Update the select field with the selected location
    const select = document.getElementById(currentLocationField);
    
    // Check if the location matches any existing options
    const existingOption = Array.from(select.options).find(opt => 
        opt.value.toLowerCase() === selectedLocation.address.toLowerCase()
    );

    if (existingOption) {
        // If location matches an existing option, select it
        select.value = existingOption.value;
    } else {
        // If it's a new location, add it as a new option
        const option = document.createElement('option');
        option.value = selectedLocation.address;
        option.text = selectedLocation.address;
        select.appendChild(option);
        select.value = option.value;
    }

    // Close the map modal
    closeMap();
};

// Mock bus data with capacity
const buses = [
    { 
        busNumber: 'CB101', 
        name: 'City Express', 
        from: 'Central Station', 
        to: 'Tech Park',
        fromCoordinates: { lat: 28.6139, lng: 77.2090 },
        toCoordinates: { lat: 28.6139, lng: 77.2090 },
        scheduledDeparture: '08:30 AM',
        scheduledArrival: '09:15 AM',
        actualDeparture: null,
        actualArrival: null,
        vehicle: 'MH12-AB-1234', 
        price: 40,
        totalCapacity: 50,
        availableSeats: 50
    },
    { 
        busNumber: 'CB202', 
        name: 'Airport Shuttle', 
        from: 'City Mall', 
        to: 'Airport', 
        scheduledDeparture: '09:00 AM',
        scheduledArrival: '09:45 AM',
        actualDeparture: null,
        actualArrival: null,
        vehicle: 'MH12-CD-5678', 
        price: 60,
        totalCapacity: 40,
        availableSeats: 40
    },
    { 
        busNumber: 'CB303', 
        name: 'Tech Loop', 
        from: 'Tech Park', 
        to: 'Central Station', 
        timing: '09:30 AM', 
        vehicle: 'MH12-EF-9012', 
        price: 35,
        totalCapacity: 45,
        availableSeats: 45
    },
    { 
        busNumber: 'CB404', 
        name: 'Mall Express', 
        from: 'Central Station', 
        to: 'City Mall', 
        timing: '10:00 AM', 
        vehicle: 'MH12-GH-3456', 
        price: 25,
        totalCapacity: 55,
        availableSeats: 55
    },
    { 
        busNumber: 'CB505', 
        name: 'Airport Connect', 
        from: 'Central Station', 
        to: 'Airport', 
        timing: '10:30 AM', 
        vehicle: 'MH12-IJ-7890', 
        price: 55,
        totalCapacity: 35,
        availableSeats: 35
    },
    { 
        busNumber: 'CB606', 
        name: 'Tech Shuttle', 
        from: 'City Mall', 
        to: 'Tech Park', 
        timing: '11:00 AM', 
        vehicle: 'MH12-KL-2345', 
        price: 45,
        totalCapacity: 48,
        availableSeats: 48
    },
    { 
        busNumber: 'CB707', 
        name: 'City Hopper', 
        from: 'Airport', 
        to: 'City Mall', 
        timing: '11:30 AM', 
        vehicle: 'MH12-MN-6789', 
        price: 50,
        totalCapacity: 42,
        availableSeats: 42
    },
    { 
        busNumber: 'CB808', 
        name: 'Express Line', 
        from: 'Tech Park', 
        to: 'Airport', 
        timing: '12:00 PM', 
        vehicle: 'MH12-OP-1234', 
        price: 65,
        totalCapacity: 30,
        availableSeats: 30
    },
    { 
        busNumber: 'CB909', 
        name: 'Mall Hopper', 
        from: 'Airport', 
        to: 'Central Station', 
        timing: '12:30 PM', 
        vehicle: 'MH12-QR-5678', 
        price: 45,
        totalCapacity: 45,
        availableSeats: 45
    },
    { 
        busNumber: 'CB1010', 
        name: 'Tech Express', 
        from: 'City Mall', 
        to: 'Central Station', 
        timing: '01:00 PM', 
        vehicle: 'MH12-ST-9012', 
        price: 30,
        totalCapacity: 50,
        availableSeats: 50
    },
    { 
        busNumber: 'CB1111', 
        name: 'Airport Express', 
        from: 'Tech Park', 
        to: 'City Mall', 
        timing: '01:30 PM', 
        vehicle: 'MH12-UV-3456', 
        price: 40,
        totalCapacity: 40,
        availableSeats: 40
    },
    { 
        busNumber: 'CB1212', 
        name: 'City Connect', 
        from: 'Central Station', 
        to: 'Airport', 
        timing: '02:00 PM', 
        vehicle: 'MH12-WX-7890', 
        price: 55,
        totalCapacity: 35,
        availableSeats: 35
    }
];

// 5. Booking Flow
// Book ticket
window.bookTicket = function(busNumber) {
    try {
        if (!busNumber) {
            throw new Error('Bus number is required');
        }

        // Get stored booking details
        let bookingDetails;
        try {
            const stored = sessionStorage.getItem('bookingDetails');
            if (!stored) {
                throw new Error('Booking details not found');
            }
            bookingDetails = JSON.parse(stored);
        } catch (e) {
            throw new Error('Invalid booking details. Please start a new booking.');
        }

        // Find the bus
        const bus = buses.find(b => b.busNumber === busNumber);
        if (!bus) {
            throw new Error('Bus not found');
        }

        const quantity = bookingDetails.quantity || 1;

        // Validate quantity and availability
        if (quantity < 1 || quantity > 6) {
            throw new Error('Please select between 1 and 6 passengers.');
        }
        
        if (bus.availableSeats < quantity) {
            throw new Error(`Sorry, only ${bus.availableSeats} seats are available.`);
        }

        // Generate tickets
        const userId = 'USER' + Math.floor(Math.random() * 10000);
        const tickets = [];
        const bookingTime = new Date().toLocaleString();

        for (let i = 0; i < quantity; i++) {
            const ticket = {
                ticketNumber: 'TKT' + Math.floor(Math.random() * 1000000),
                passengerNum: i + 1,
                userId: userId,
                bookingDate: bookingTime,
                travelDate: bookingDetails.date,
                from: bus.from,
                to: bus.to,
                quantity: 1,
                busNumber: bus.busNumber,
                busName: bus.name,
                price: bus.price,
                timing: bus.scheduledDeparture || bus.timing,
                vehicle: bus.vehicle,
                status: 'booked',
                seatNumber: bus.totalCapacity - bus.availableSeats + i + 1
            };
            tickets.push(ticket);
        }

        // Update bus capacity
        bus.availableSeats -= quantity;

        // Create booking object
        const booking = {
            bookingId: 'BKG' + Math.floor(Math.random() * 1000000),
            ...tickets[0],
            quantity: quantity,
            totalPrice: bus.price * quantity,
            subTickets: tickets
        };

        // Add to tickets array
        allTickets.push(booking);
        activeTicket = booking;

        // Save state after booking
        saveState();

        // Clear booking details from session
        sessionStorage.removeItem('bookingDetails');

        // Show success message with booking details
        const message = `
            Booking Successful!
            Booking ID: ${booking.bookingId}
            Number of Tickets: ${quantity}
            Total Amount: ₹${booking.totalPrice}
            
            Your tickets have been generated. You can view them in the Tickets section.
        `;
        alert(message);

        // Show ticket section
        showScreen(SCREENS.TICKET_SECTION);
        showAllTickets();

        // Update navigation
        currentStep++;
        updateNavigation();
    } catch (error) {
        console.error('Error in bookTicket:', error);
        alert(error.message || 'There was an error processing your booking. Please try again.');
    }
};

// Show ticket
function showTicket() {
    try {
        if (!activeTicket) {
            console.warn('No active ticket to display');
            return;
        }
        
        const ticketSection = document.querySelector('.ticket-content');
        if (!ticketSection) {
            console.error('Ticket section not found');
            return;
        }
        
        let ticketHTML = '';
        
        if (activeTicket.status === 'preview') {
            ticketHTML = generatePreviewTicket(activeTicket);
        } else if (activeTicket.subTickets) {
            ticketHTML = generateMultipleTickets(activeTicket);
        } else {
            ticketHTML = generateSingleTicket(activeTicket);
        }
        
        ticketSection.innerHTML = ticketHTML;
    } catch (error) {
        console.error('Error in showTicket:', error);
    }
}

function generatePreviewTicket(ticket) {
    return `
        <div class="ticket preview">
            <div class="ticket-details">
                <div><b>Bus Details Preview</b></div>
                <div><b>Bus:</b> ${ticket.busName} (${ticket.busNumber})</div>
                <div><b>Route:</b> ${ticket.from} → ${ticket.to}</div>
                <div><b>Timing:</b> ${ticket.timing}</div>
                <div><b>Price:</b> ₹${ticket.price} per ticket</div>
                <div><b>Available Seats:</b> ${ticket.availableSeats}/${ticket.totalCapacity}</div>
                <div><b>Vehicle:</b> ${ticket.vehicle}</div>
            </div>
        </div>
    `;
}

// Generate QR code with ticket information
function generateQR(ticket) {
    // Create ticket data object
    const ticketData = {
        ticketNumber: ticket.ticketNumber,
        seatNumber: ticket.seatNumber,
        userId: ticket.userId,
        from: ticket.from,
        to: ticket.to,
        busNumber: ticket.busNumber,
        busName: ticket.busName,
        price: ticket.price,
        timing: ticket.timing,
        vehicle: ticket.vehicle,
        status: ticket.status,
        bookingDate: ticket.bookingDate
    };

    // Convert ticket data to JSON string
    const ticketDataString = JSON.stringify(ticketData);

    // For now, we'll use a simple SVG representation of QR code
    // In a real application, you would use a QR code library
    return `
        <div class="ticket-codes">
            <div class="qr-code">
                <svg width='120' height='120' viewBox='0 0 120 120'>
                    <rect width='120' height='120' rx='8' fill='#fff'/>
                    <rect x='12' y='12' width='24' height='24' fill='#000'/>
                    <rect x='84' y='12' width='24' height='24' fill='#000'/>
                    <rect x='12' y='84' width='24' height='24' fill='#000'/>
                    <rect x='48' y='48' width='24' height='24' fill='#000'/>
                    <text x='60' y='110' text-anchor='middle' font-size='8' fill='#666'>Scan to verify</text>
                </svg>
            </div>
            <div class="barcode">
                <svg width='200' height='60' viewBox='0 0 200 60'>
                    <rect width='200' height='60' fill='#fff'/>
                    ${generateBarcode(ticketDataString)}
                    <text x='100' y='55' text-anchor='middle' font-size='8' fill='#666'>${ticket.ticketNumber}</text>
                </svg>
            </div>
        </div>
    `;
}

// Generate barcode pattern
function generateBarcode(data) {
    // Simple barcode pattern generation
    // In a real application, you would use a barcode library
    let barcode = '';
    let x = 10;
    const barWidth = 2;
    const barHeight = 40;
    
    // Convert data to binary string
    const binary = data.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
    
    // Generate bars
    for (let i = 0; i < binary.length; i++) {
        const isBar = binary[i] === '1';
        if (isBar) {
            barcode += `<rect x="${x}" y="5" width="${barWidth}" height="${barHeight}" fill="#000"/>`;
        }
        x += barWidth;
    }
    
    return barcode;
}

// Show all tickets
function showAllTickets() {
    try {
        const ticketSection = document.querySelector('.ticket-content');
        if (!ticketSection) {
            console.error('Ticket section not found');
            return;
        }

        // Get all tickets (active and archived)
        const allTicketsList = [...allTickets, ...archivedTickets];
        
        if (allTicketsList.length === 0) {
            ticketSection.innerHTML = `
                <div style="text-align:center; color:#64748b; padding:2em;">
                    <div style="font-size:1.2em; margin-bottom:0.5em;">No Tickets Found</div>
                    <div style="font-size:0.9em;">Book a ticket to get started</div>
                    <button class="btn" style="margin-top:1em;" onclick="showScreen('${SCREENS.BOOKING_FORM}')">Book Now</button>
                </div>
            `;
            return;
        }

        // Group tickets by status
        const groupedTickets = {
            booked: [],
            checkedIn: [],
            checkedOut: []
        };

        allTicketsList.forEach(ticket => {
            if (ticket.subTickets) {
                // Handle multiple tickets from a single booking
                ticket.subTickets.forEach(subTicket => {
                    const status = subTicket.status;
                    if (status === 'booked') groupedTickets.booked.push(subTicket);
                    else if (status === 'checked-in') groupedTickets.checkedIn.push(subTicket);
                    else if (status === 'checked-out') groupedTickets.checkedOut.push(subTicket);
                });
            } else {
                // Handle single tickets
                const status = ticket.status;
                if (status === 'booked') groupedTickets.booked.push(ticket);
                else if (status === 'checked-in') groupedTickets.checkedIn.push(ticket);
                else if (status === 'checked-out') groupedTickets.checkedOut.push(ticket);
            }
        });

        let html = '';

        // Booked Tickets Section
        if (groupedTickets.booked.length > 0) {
            html += `
                <div class="ticket-group-section">
                    <h3>Active Tickets (${groupedTickets.booked.length})</h3>
                    <div class="ticket-grid">
                        ${groupedTickets.booked.map(ticket => generateTicketCard(ticket, 'booked')).join('')}
                    </div>
                </div>
            `;
        }

        // Checked-in Tickets Section
        if (groupedTickets.checkedIn.length > 0) {
            html += `
                <div class="ticket-group-section">
                    <h3>Checked-in Tickets (${groupedTickets.checkedIn.length})</h3>
                    <div class="ticket-grid">
                        ${groupedTickets.checkedIn.map(ticket => generateTicketCard(ticket, 'checked-in')).join('')}
                    </div>
                </div>
            `;
        }

        // Checked-out Tickets Section
        if (groupedTickets.checkedOut.length > 0) {
            html += `
                <div class="ticket-group-section">
                    <h3>Completed Journeys (${groupedTickets.checkedOut.length})</h3>
                    <div class="ticket-grid">
                        ${groupedTickets.checkedOut.map(ticket => generateTicketCard(ticket, 'checked-out')).join('')}
                    </div>
                </div>
            `;
        }

        ticketSection.innerHTML = html || `
            <div style="text-align:center; color:#64748b; padding:2em;">
                <div style="font-size:1.2em; margin-bottom:0.5em;">No Tickets Found</div>
                <div style="font-size:0.9em;">Book a ticket to get started</div>
                <button class="btn" style="margin-top:1em;" onclick="showScreen('${SCREENS.BOOKING_FORM}')">Book Now</button>
            </div>
        `;
    } catch (error) {
        console.error('Error in showAllTickets:', error);
    }
}

// Show all archived tickets
function showArchivedTickets() {
    try {
        const archiveSection = document.getElementById('archivedTickets');
        if (!archiveSection) {
            console.error('Archive section not found');
            return;
        }

        if (archivedTickets.length === 0) {
            archiveSection.innerHTML = `
                <div style="text-align:center; color:#64748b; padding:2em;">
                    <div style="font-size:1.2em; margin-bottom:0.5em;">No Archived Tickets</div>
                    <div style="font-size:0.9em;">Completed journeys will appear here</div>
                </div>
            `;
            return;
        }

        // Sort archived tickets by date (most recent first)
        const sortedTickets = [...archivedTickets].sort((a, b) => {
            const dateA = new Date(a.archiveDate || a.checkOutTime || a.bookingDate);
            const dateB = new Date(b.archiveDate || b.checkOutTime || b.bookingDate);
            return dateB - dateA;
        });

        // Group tickets by month and year
        const groupedTickets = sortedTickets.reduce((groups, ticket) => {
            const date = new Date(ticket.archiveDate || ticket.checkOutTime || ticket.bookingDate);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(ticket);
            return groups;
        }, {});

        let html = `
            <div class="archive-header">
                <h2>Archived Tickets</h2>
                <div class="archive-count">${archivedTickets.length} ticket${archivedTickets.length !== 1 ? 's' : ''}</div>
            </div>
        `;

        // Generate HTML for each month group
        Object.entries(groupedTickets).forEach(([monthYear, tickets]) => {
            html += `
                <div class="archive-group">
                    <h3 class="archive-month">${monthYear}</h3>
                    <div class="ticket-grid">
                        ${tickets.map(ticket => generateTicketCard(ticket, 'archived')).join('')}
                    </div>
                </div>
            `;
        });

        archiveSection.innerHTML = html;
    } catch (error) {
        console.error('Error in showArchivedTickets:', error);
        alert('There was an error loading archived tickets. Please try again.');
    }
}

// Show all buses
function showAllBuses() {
    try {
        const busList = document.querySelector('.bus-list-content');
        if (!busList) {
            console.error('Bus list container not found');
            return;
        }

        // Get stored booking details
        let bookingDetails;
        try {
            const stored = sessionStorage.getItem('bookingDetails');
            if (stored) {
                bookingDetails = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Error reading stored booking details:', e);
        }

        if (!bookingDetails) {
            busList.innerHTML = `
                <div style="text-align:center; padding:2em; color:#666;">
                    <div style="font-size:1.2em; margin-bottom:0.5em;">No Search Criteria</div>
                    <div style="font-size:0.9em;">Please select your route and travel details first.</div>
                    <button class="btn" style="margin-top:1em;" onclick="showScreen('${SCREENS.BOOKING_FORM}')">Start Booking</button>
                </div>
            `;
            return;
        }

        // Filter buses based on route
        const filteredBuses = buses.filter(bus => 
            bus.from.toLowerCase() === bookingDetails.from.toLowerCase() && 
            bus.to.toLowerCase() === bookingDetails.to.toLowerCase()
        );

        if (filteredBuses.length === 0) {
            busList.innerHTML = `
                <div style="text-align:center; padding:2em; color:#666;">
                    <div style="font-size:1.2em; margin-bottom:0.5em;">No Buses Found</div>
                    <div style="font-size:0.9em;">No buses available for the selected route.</div>
                    <button class="btn" style="margin-top:1em;" onclick="showScreen('${SCREENS.BOOKING_FORM}')">Try Another Route</button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="bus-list-header">
                <h2>Available Buses</h2>
                <div class="route-info">
                    ${bookingDetails.from} → ${bookingDetails.to}
                    <span class="date-info">Date: ${bookingDetails.date}</span>
                    <span class="passenger-info">Passengers: ${bookingDetails.quantity}</span>
                </div>
            </div>
        `;

        filteredBuses.forEach(bus => {
            const isAvailable = bus.availableSeats >= bookingDetails.quantity;
            html += `
                <div class="bus-card ${!isAvailable ? 'sold-out' : ''}">
                    <svg class="bus-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="16" width="48" height="28" rx="6" fill="${isAvailable ? '#007bff' : '#6c757d'}"/>
                        <rect x="12" y="20" width="40" height="20" rx="4" fill="#fff"/>
                        <circle cx="16" cy="48" r="4" fill="#343a40"/>
                        <circle cx="48" cy="48" r="4" fill="#343a40"/>
                    </svg>
                    <div class="bus-info">
                        <div class="bus-title">${bus.name} <span style="color:#888;font-weight:400;">(${bus.busNumber})</span></div>
                        <div class="bus-meta">${bus.from} → ${bus.to}</div>
                        <div class="bus-timing">
                            <div class="timing-group">
                                <div class="timing-label">Departure:</div>
                                <div class="timing-value">${bus.scheduledDeparture || bus.timing}</div>
                            </div>
                            ${bus.scheduledArrival ? `
                                <div class="timing-group">
                                    <div class="timing-label">Arrival:</div>
                                    <div class="timing-value">${bus.scheduledArrival}</div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="bus-meta">
                            <div class="price-info">₹${bus.price} per ticket</div>
                            <div class="seats-info">Available Seats: ${bus.availableSeats}/${bus.totalCapacity}</div>
                        </div>
                        <div class="bus-meta">Vehicle: ${bus.vehicle}</div>
                    </div>
                    <div class="bus-actions">
                        <button class="view-btn" onclick="viewBusDetails('${bus.busNumber}')">View Details</button>
                        <button class="btn ${!isAvailable ? 'disabled' : ''}" 
                                onclick="bookTicket('${bus.busNumber}')" 
                                ${!isAvailable ? 'disabled' : ''}>
                            ${isAvailable ? 'Book Now' : 'Not Available'}
                        </button>
                    </div>
                </div>
            `;
        });

        busList.innerHTML = html;
    } catch (error) {
        console.error('Error in showAllBuses:', error);
        alert('There was an error loading the bus list. Please try again.');
    }
}

// Generate ticket card
function generateTicketCard(ticket, status) {
    try {
        const statusColors = {
            'booked': {
                bg: '#e8f5e9',     // Light green background
                text: '#10b981',    // Green text
                border: '#10b981'   // Green border
            },
            'checked-in': {
                bg: '#e3f2fd',     // Light blue background
                text: '#3b82f6',    // Blue text
                border: '#3b82f6'   // Blue border
            },
            'checked-out': {
                bg: '#f3f4f6',     // Light gray background
                text: '#6b7280',    // Gray text
                border: '#6b7280'   // Gray border
            },
            'archived': {
                bg: '#f9fafb',     // Lighter gray background
                text: '#9ca3af',    // Light gray text
                border: '#d1d5db'   // Light gray border
            }
        };

        const statusText = {
            'booked': 'Active - Booked',
            'checked-in': 'Active - Checked In',
            'checked-out': 'Journey Complete',
            'archived': 'Archived'
        };

        const isArchived = ticket.status === 'archived';
        const currentStatus = isArchived ? 'archived' : status;
        const colors = statusColors[currentStatus];

        return `
            <div class="ticket-card" data-ticket-number="${ticket.ticketNumber}" 
                 style="background-color: ${colors.bg}; border-color: ${colors.border};">
                <div class="ticket-header">
                    <div class="ticket-title">
                        <h4>${ticket.busName}</h4>
                        <span class="bus-number">${ticket.busNumber}</span>
                    </div>
                    <div class="ticket-status" style="background-color: ${colors.text}; color: white;">
                        ${statusText[currentStatus]}
                    </div>
                </div>
                <div class="ticket-body">
                    <div class="ticket-info">
                        <div class="route-info">
                            <div class="from">
                                <small>From</small>
                                <strong>${ticket.from}</strong>
                            </div>
                            <div class="arrow">→</div>
                            <div class="to">
                                <small>To</small>
                                <strong>${ticket.to}</strong>
                            </div>
                        </div>
                        <div class="journey-info">
                            <div class="date-info">
                                <small>Travel Date</small>
                                <strong>${ticket.travelDate || 'Not specified'}</strong>
                            </div>
                            <div class="time-info">
                                <small>Departure</small>
                                <strong>${ticket.timing}</strong>
                            </div>
                        </div>
                        <div class="passenger-info">
                            <div>
                                <small>Seat</small>
                                <strong>${ticket.seatNumber}</strong>
                            </div>
                            <div>
                                <small>Ticket No.</small>
                                <strong>${ticket.ticketNumber}</strong>
                            </div>
                        </div>
                        <div class="price-info">
                            <small>Price</small>
                            <strong>₹${ticket.price}</strong>
                        </div>
                    </div>
                    <div class="ticket-actions">
                        <button class="btn view-btn" onclick="viewTicketDetails('${ticket.ticketNumber}')">
                            View Details
                        </button>
                        ${status === 'booked' ? `
                            <button class="btn check-in-btn" onclick="checkInTicket('${ticket.ticketNumber}')">
                                Check In
                            </button>
                        ` : status === 'checked-in' ? `
                            <button class="btn check-out-btn" onclick="checkOutTicket('${ticket.ticketNumber}')">
                                Check Out
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${generateQR(ticket)}
            </div>
        `;
    } catch (error) {
        console.error('Error generating ticket card:', error);
        return '';
    }
}

// Helper function to find a ticket
function findTicket(ticketNumber) {
    // Search in all tickets
    for (const booking of allTickets) {
        if (booking.subTickets) {
            const found = booking.subTickets.find(t => t.ticketNumber === ticketNumber);
            if (found) return found;
        }
        if (booking.ticketNumber === ticketNumber) {
            return booking;
        }
    }
    // Search in archived tickets
    return archivedTickets.find(t => t.ticketNumber === ticketNumber);
}

// Check in ticket
window.checkInTicket = function(ticketNumber) {
    try {
        if (!ticketNumber) {
            throw new Error('Ticket number is required');
        }

        const ticket = findTicket(ticketNumber);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (ticket.status !== 'booked') {
            throw new Error(`Invalid ticket status for check-in: ${ticket.status}`);
        }

        // Update ticket status
        ticket.status = 'checked-in';
        ticket.checkInTime = new Date().toLocaleString();

        // Save state after check-in
        saveState();

        // Update display
        showAllTickets();
        alert('Ticket checked in successfully!');
    } catch (error) {
        console.error('Error checking in ticket:', error);
        alert(error.message || 'There was an error checking in the ticket. Please try again.');
    }
};

// Check out ticket
window.checkOutTicket = function(ticketNumber) {
    try {
        if (!ticketNumber) {
            throw new Error('Ticket number is required');
        }

        const ticket = findTicket(ticketNumber);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (ticket.status !== 'checked-in') {
            throw new Error(`Invalid ticket status for check-out: ${ticket.status}`);
        }

        // Update ticket status
        ticket.status = 'checked-out';
        ticket.checkOutTime = new Date().toLocaleString();

        // Move to archived tickets
        moveToArchive(ticket);

        // Save state after check-out
        saveState();

        // Update displays
        showAllTickets();
        showArchivedTickets();
        updateNavigationButtons();

        alert('Ticket checked out successfully and moved to archive.');
    } catch (error) {
        console.error('Error checking out ticket:', error);
        alert(error.message || 'There was an error checking out the ticket. Please try again.');
    }
};

// Move ticket to archive
function moveToArchive(ticket) {
    try {
        if (!ticket || !ticket.ticketNumber) {
            throw new Error('Invalid ticket object');
        }

        // Find and remove the ticket from allTickets
        const ticketIndex = allTickets.findIndex(t => 
            t.ticketNumber === ticket.ticketNumber || 
            (t.subTickets && t.subTickets.some(st => st.ticketNumber === ticket.ticketNumber))
        );

        if (ticketIndex === -1) {
            throw new Error('Ticket not found in active tickets');
        }

        const booking = allTickets[ticketIndex];
        
        // If it's a booking with multiple tickets
        if (booking.subTickets) {
            // Check if all sub-tickets are checked out
            const allCheckedOut = booking.subTickets.every(t => t.status === 'checked-out');
            if (allCheckedOut) {
                // Move entire booking to archive
                booking.status = 'archived';
                booking.archiveDate = new Date().toLocaleString();
                archivedTickets.push(booking);
                allTickets.splice(ticketIndex, 1);
            }
        } else {
            // Single ticket booking
            booking.status = 'archived';
            booking.archiveDate = new Date().toLocaleString();
            archivedTickets.push(booking);
            allTickets.splice(ticketIndex, 1);
        }

        // Save state after archiving
        saveState();

        return true;
    } catch (error) {
        console.error('Error moving ticket to archive:', error);
        throw error;
    }
}

// View ticket details
window.viewTicketDetails = function(ticketNumber) {
    try {
        // Find the ticket
        const ticket = findTicket(ticketNumber);
        if (!ticket) {
            alert('Ticket not found.');
            return;
        }

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';

        modal.innerHTML = `
            <div class="modal-content ticket-details-modal">
                <div class="modal-header">
                    <h3>Ticket Details</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="ticket-details">
                        <div class="detail-group">
                            <h4>Journey Details</h4>
                            <div class="detail-row">
                                <div class="detail-label">Bus</div>
                                <div class="detail-value">${ticket.busName} (${ticket.busNumber})</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Route</div>
                                <div class="detail-value">${ticket.from} → ${ticket.to}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Travel Date</div>
                                <div class="detail-value">${ticket.travelDate || 'Not specified'}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Departure</div>
                                <div class="detail-value">${ticket.timing}</div>
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4>Ticket Information</h4>
                            <div class="detail-row">
                                <div class="detail-label">Ticket Number</div>
                                <div class="detail-value">${ticket.ticketNumber}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Seat Number</div>
                                <div class="detail-value">${ticket.seatNumber}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Price</div>
                                <div class="detail-value">₹${ticket.price}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Status</div>
                                <div class="detail-value">${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</div>
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4>Booking Information</h4>
                            <div class="detail-row">
                                <div class="detail-label">Booking Date</div>
                                <div class="detail-value">${ticket.bookingDate}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">User ID</div>
                                <div class="detail-value">${ticket.userId}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Vehicle</div>
                                <div class="detail-value">${ticket.vehicle}</div>
                            </div>
                        </div>
                    </div>
                    ${generateQR(ticket)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing ticket details:', error);
        alert('There was an error loading ticket details. Please try again.');
    }
};

// Show filtered buses based on route
function showFilteredBuses(from, to) {
    try {
        // Show bus list screen
        showScreen(SCREENS.BUS_LIST);
        
        const busList = document.querySelector('.bus-list-content');
        if (!busList) {
            console.error('Bus list container not found');
            return;
        }

        // Filter buses based on route
        const filteredBuses = buses.filter(bus => 
            bus.from.toLowerCase() === from.toLowerCase() && 
            bus.to.toLowerCase() === to.toLowerCase()
        );
        
        if (filteredBuses.length === 0) {
            busList.innerHTML = `
                <div style="text-align:center; padding:2em; color:#666;">
                    <div style="font-size:1.2em; margin-bottom:0.5em;">No Buses Found</div>
                    <div style="font-size:0.9em;">No buses available for the selected route.</div>
                    <button class="btn" style="margin-top:1em;" onclick="showScreen('${SCREENS.BOOKING_FORM}')">Try Another Route</button>
                </div>
            `;
            return;
        }

        let html = '';
        filteredBuses.forEach(bus => {
            const isAvailable = bus.availableSeats > 0;
            html += `
                <div class="bus-card ${!isAvailable ? 'sold-out' : ''}">
                    <svg class="bus-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="16" width="48" height="28" rx="6" fill="${isAvailable ? '#007bff' : '#6c757d'}"/>
                        <rect x="12" y="20" width="40" height="20" rx="4" fill="#fff"/>
                        <circle cx="16" cy="48" r="4" fill="#343a40"/>
                        <circle cx="48" cy="48" r="4" fill="#343a40"/>
                    </svg>
                    <div class="bus-info">
                        <div class="bus-title">${bus.name} <span style="color:#888;font-weight:400;">(${bus.busNumber})</span></div>
                        <div class="bus-meta">${bus.from} → ${bus.to}</div>
                        <div class="bus-timing">
                            <div class="timing-group">
                                <div class="timing-label">Scheduled:</div>
                                <div class="timing-value">Departure: ${bus.scheduledDeparture || bus.timing}</div>
                                <div class="timing-value">Arrival: ${bus.scheduledArrival || 'N/A'}</div>
                            </div>
                            ${bus.actualDeparture || bus.actualArrival ? `
                                <div class="timing-group">
                                    <div class="timing-label">Actual:</div>
                                    ${bus.actualDeparture ? `<div class="timing-value">Departure: ${bus.actualDeparture}</div>` : ''}
                                    ${bus.actualArrival ? `<div class="timing-value">Arrival: ${bus.actualArrival}</div>` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="bus-meta">₹${bus.price} per ticket | Available Seats: ${bus.availableSeats}/${bus.totalCapacity}</div>
                        <div class="bus-meta">Vehicle: ${bus.vehicle}</div>
                    </div>
                    <div class="bus-actions">
                        <button class="view-btn" onclick="viewBusDetails('${bus.busNumber}')">View Details</button>
                        <button class="btn" style="width:auto;padding:0.5em 1em;font-size:1em;" 
                                onclick="bookTicket('${bus.busNumber}')" 
                                ${!isAvailable ? 'disabled' : ''}>
                            ${isAvailable ? 'Book Now' : 'Sold Out'}
                        </button>
                    </div>
                </div>
            `;
        });

        busList.innerHTML = html;
    } catch (error) {
        console.error('Error in showFilteredBuses:', error);
    }
}

// 4. Booking Option/Type Selection
// Select booking option
window.selectBookingOption = function(option) {
    try {
        // Update selection state
        selectedBookingLocation = option;
        
        // Update UI
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        const selectedOpt = document.querySelector(`[data-value="${option}"]`);
        if (selectedOpt) selectedOpt.classList.add('selected');
        
        // Show/hide relevant sections
        const bookingTypeOptions = document.getElementById('bookingTypeOptions');
        const callCenterInfo = document.getElementById('callCenterInfo');
        const continueBtn = document.getElementById('continueBtn');
        
        if (bookingTypeOptions) bookingTypeOptions.style.display = option === 'bus-stop' ? 'block' : 'none';
        if (callCenterInfo) callCenterInfo.style.display = 'none';
        if (continueBtn) continueBtn.style.display = option === 'outside' ? 'block' : 'none';
        
        // Reset booking type when location changes
        selectedBookingType = null;
    } catch (error) {
        console.error('Error in selectBookingOption:', error);
    }
}

// Select booking type (self-online or call-center)
window.selectBookingType = function(type) {
    try {
        // Update selection state
        selectedBookingType = type;
        
        // Update UI
        document.querySelectorAll('.booking-type-options .option').forEach(opt => {
            opt.classList.remove('selected');
        });
        const selectedOpt = document.querySelector(`[data-value="${type}"]`);
        if (selectedOpt) selectedOpt.classList.add('selected');
        
        // Show/hide call center info and continue button
        const callCenterInfo = document.getElementById('callCenterInfo');
        const continueBtn = document.getElementById('continueBtn');
        
        if (callCenterInfo) {
            callCenterInfo.style.display = type === 'call-center' ? 'block' : 'none';
        }
        if (continueBtn) {
            continueBtn.style.display = type === 'self-online' ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error in selectBookingType:', error);
    }
}

// Next booking step
window.nextBookingStep = function() {
    try {
        if (!selectedBookingLocation) {
            alert('Please select a booking location first.');
            return;
        }
        
        if (selectedBookingLocation === 'bus-stop' && !selectedBookingType) {
            alert('Please select a booking type first.');
            return;
        }
        
        if (selectedBookingLocation === 'bus-stop' && selectedBookingType === 'call-center') {
            alert('Please contact our call center to proceed with your booking.');
            return;
        }
        
        showScreen(SCREENS.BOOKING_FORM);
        initializeBookingForm();
    } catch (error) {
        console.error('Error in nextBookingStep:', error);
    }
}

// Show booking step
function showBookingStep() {
    const bookingStep = document.querySelector('.booking-step');
    if (bookingStep) bookingStep.style.display = 'block';

    // Show nav bar with Home button
    const mainNav = document.getElementById('mainNav');
    if (mainNav) {
        mainNav.innerHTML = `
            <div class="nav-container">
                <div class="nav-links">
                    <button class="nav-link home-btn" onclick="goHome()">Home</button>
                    <button class="nav-link" onclick="showScreen('${SCREENS.BOOKING_STEP}')">Booking</button>
                    <button class="nav-link" onclick="showScreen('${SCREENS.BUS_LIST}')">Bus List</button>
                    <button class="nav-link" onclick="showScreen('${SCREENS.TICKET_SECTION}')">Tickets</button>
                    <button class="nav-link" onclick="showScreen('${SCREENS.ARCHIVE_SECTION}')">Archive</button>
                    <button class="nav-link exit-btn" onclick="exitApp()">Exit</button>
                </div>
            </div>
        `;
        mainNav.style.display = 'block';
        mainNav.style.opacity = '1';
        mainNav.style.visibility = 'visible';
    }

    // Add form submission handler
    document.getElementById('busBookingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        searchBuses();
    });
}

// Search buses
window.searchBuses = function() {
    try {
        const fromLocation = document.getElementById('fromLocation');
        const toLocation = document.getElementById('toLocation');
        const travelDate = document.getElementById('travelDate');
        const passengers = document.getElementById('passengers');
        
        if (!fromLocation || !toLocation || !travelDate || !passengers) {
            console.error('Required form elements not found');
            alert('There was an error with the form. Please try again.');
            return;
        }

        const from = fromLocation.value;
        const to = toLocation.value;
        const date = travelDate.value;
        const quantity = parseInt(passengers.value);
        
        // Validate inputs
        if (!from || !to) {
            alert('Please select both starting point and destination.');
            return;
        }
        
        if (from === to) {
            alert('Starting point and destination cannot be the same.');
            return;
        }

        if (!date) {
            alert('Please select a travel date.');
            return;
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert('Please select a future date for travel.');
            return;
        }

        if (!quantity || quantity < 1 || quantity > 6) {
            alert('Please select between 1 and 6 passengers.');
            return;
        }

        // Store booking details in session
        sessionStorage.setItem('bookingDetails', JSON.stringify({
            from,
            to,
            date,
            quantity
        }));

        // Show bus list screen with filtered results
        showScreen(SCREENS.BUS_LIST);
        showFilteredBuses(from, to);
        
        // Update navigation
        currentStep++;
        updateNavigation();
    } catch (error) {
        console.error('Error in searchBuses:', error);
        alert('There was an error searching for buses. Please try again.');
    }
};

// Exit app with window close
window.exitApp = function() {
    if (confirm('Are you sure you want to exit the app?')) {
        window.close();
        // Fallback if window.close() is blocked
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 1rem;
                padding: 2rem;
                text-align: center;
            ">
                <h1 style="color: var(--primary);">Thank you for using CityBus!</h1>
                <p>The application has been closed. You can now close this window.</p>
                <button onclick="window.location.reload()" style="
                    padding: 0.8rem 1.5rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Restart App</button>
            </div>
        `;
    }
};

// Start booking process from welcome screen
window.startBooking = function() {
    showScreen(SCREENS.BOOKING_STEP);
}

function initializeApp() {
    // Hide all screens except home initially
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('home').classList.add('active');
}

function returnToHome() {
    goHome();
}

function returnToWelcomeStep() {
    goHome();
}

function startBooking() {
    showScreen(SCREENS.BOOKING_STEP);
}

function selectBookingOption(option) {
    // Handle booking option selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-value="${option}"]`).classList.add('selected');
    
    // Show/hide booking type options based on selection
    const bookingTypeOptions = document.getElementById('bookingTypeOptions');
    const callCenterInfo = document.getElementById('callCenterInfo');
    
    if (option === 'bus-stop') {
        bookingTypeOptions.style.display = 'block';
        callCenterInfo.style.display = 'none';
    } else {
        bookingTypeOptions.style.display = 'none';
        callCenterInfo.style.display = 'none';
    }
}

function selectBookingType(type) {
    // Handle booking type selection
    document.querySelectorAll('.booking-type-options .option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-value="${type}"]`).classList.add('selected');
    
    if (type === 'call-center') {
        document.getElementById('callCenterInfo').style.display = 'block';
    } else {
        document.getElementById('callCenterInfo').style.display = 'none';
    }
}

function nextBookingStep() {
    showScreen(SCREENS.BOOKING_STEP);
}

function initializeBookingForm() {
    try {
        const bookingForm = document.getElementById('bookingForm');
        if (!bookingForm) {
            console.error('Booking form container not found');
            return;
        }

        // Get stored booking details if any
        let storedDetails = {};
        try {
            const stored = sessionStorage.getItem('bookingDetails');
            if (stored) {
                storedDetails = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Error reading stored booking details:', e);
        }

        const today = new Date().toISOString().split('T')[0];
        
        bookingForm.innerHTML = `
            <div class="booking-form-container">
                <h2>Book Your Journey</h2>
                <form id="busBookingForm" onsubmit="return false;">
                    <div class="form-group">
                        <label for="fromLocation">From</label>
                        <select id="fromLocation" required>
                            <option value="">Select starting point</option>
                            <option value="Central Station" ${storedDetails.from === 'Central Station' ? 'selected' : ''}>Central Station</option>
                            <option value="City Mall" ${storedDetails.from === 'City Mall' ? 'selected' : ''}>City Mall</option>
                            <option value="Tech Park" ${storedDetails.from === 'Tech Park' ? 'selected' : ''}>Tech Park</option>
                            <option value="Airport" ${storedDetails.from === 'Airport' ? 'selected' : ''}>Airport</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="toLocation">To</label>
                        <select id="toLocation" required>
                            <option value="">Select destination</option>
                            <option value="Central Station" ${storedDetails.to === 'Central Station' ? 'selected' : ''}>Central Station</option>
                            <option value="City Mall" ${storedDetails.to === 'City Mall' ? 'selected' : ''}>City Mall</option>
                            <option value="Tech Park" ${storedDetails.to === 'Tech Park' ? 'selected' : ''}>Tech Park</option>
                            <option value="Airport" ${storedDetails.to === 'Airport' ? 'selected' : ''}>Airport</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="travelDate">Travel Date</label>
                        <input type="date" id="travelDate" required min="${today}" value="${storedDetails.date || ''}">
                    </div>
                    <div class="form-group">
                        <label for="passengers">Number of Passengers</label>
                        <input type="number" id="passengers" min="1" max="6" value="${storedDetails.quantity || 1}" required>
                        <small class="form-text">Maximum 6 passengers per booking</small>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn secondary" onclick="goHome()">Cancel</button>
                        <button type="submit" class="btn primary">Search Buses</button>
                    </div>
                </form>
            </div>
        `;

        // Add form submission handler
        const form = document.getElementById('busBookingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                searchBuses();
            });

            // Add change handlers for from/to locations
            const fromSelect = document.getElementById('fromLocation');
            const toSelect = document.getElementById('toLocation');

            if (fromSelect && toSelect) {
                fromSelect.addEventListener('change', () => {
                    if (fromSelect.value === toSelect.value && toSelect.value !== '') {
                        alert('Starting point and destination cannot be the same.');
                        fromSelect.value = '';
                    }
                });

                toSelect.addEventListener('change', () => {
                    if (toSelect.value === fromSelect.value && fromSelect.value !== '') {
                        alert('Starting point and destination cannot be the same.');
                        toSelect.value = '';
                    }
                });
            }
        }

        console.log('Booking form initialized successfully');
    } catch (error) {
        console.error('Error initializing booking form:', error);
        alert('There was an error loading the booking form. Please try again.');
    }
}

function updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link, index) => {
        // Remove all classes first
        link.classList.remove('active', 'completed');
        
        // Add appropriate classes based on current step
        if (index < currentStep) {
            link.classList.add('completed');
        } else if (index === currentStep) {
            link.classList.add('active');
        }
        
        // Show all navigation links
        link.style.display = 'block';
    });
}

function resetBookingSteps() {
    currentStep = 0;
    document.querySelector('.welcome-section').style.display = 'block';
    document.querySelector('.booking-step').style.display = 'none';
    document.getElementById('bookingTypeOptions').style.display = 'none';
    document.getElementById('callCenterInfo').style.display = 'none';
    document.getElementById('mainNav').style.display = 'none';
}

function exitApp() {
    if (confirm('Are you sure you want to exit?')) {
        returnToHome();
    }
}

// Map related functions
function initMap() {
    // Initialize MapmyIndia map
    // This will be implemented when you add your MapmyIndia API key
}

function searchLocation() {
    // Implement location search functionality
}

function closeMap() {
    document.getElementById('mapModal').style.display = 'none';
}

function confirmLocation() {
    // Implement location confirmation
    closeMap();
}

// Home button functionality
window.goHome = function() {
    try {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        // Show home screen
        const homeScreen = document.getElementById('home');
        if (homeScreen) {
            homeScreen.classList.add('active');
            homeScreen.style.display = '';
        }
        
        // Reset UI state
        const welcomeSection = document.querySelector('.welcome-section');
        const bookingStep = document.querySelector('.booking-step');
        const mainNav = document.getElementById('mainNav');
        
        if (welcomeSection) welcomeSection.style.display = 'block';
        if (bookingStep) bookingStep.style.display = 'none';
        if (mainNav) mainNav.style.display = 'none';
        
        // Reset state
        resetBookingSteps();
        
        console.log('Returned to home successfully');
    } catch (error) {
        console.error('Error returning to home:', error);
    }
}

// Add missing viewBusDetails function
window.viewBusDetails = function(busNumber) {
    const bus = buses.find(b => b.busNumber === busNumber);
    if (!bus) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Bus Details</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="bus-details">
                <div class="detail-row"><b>Bus Number:</b> ${bus.busNumber}</div>
                <div class="detail-row"><b>Name:</b> ${bus.name}</div>
                <div class="detail-row"><b>Route:</b> ${bus.from} → ${bus.to}</div>
                <div class="detail-row"><b>Scheduled Departure:</b> ${bus.scheduledDeparture || bus.timing}</div>
                <div class="detail-row"><b>Scheduled Arrival:</b> ${bus.scheduledArrival || 'N/A'}</div>
                <div class="detail-row"><b>Vehicle Number:</b> ${bus.vehicle}</div>
                <div class="detail-row"><b>Price:</b> ₹${bus.price}</div>
                <div class="detail-row"><b>Available Seats:</b> ${bus.availableSeats}/${bus.totalCapacity}</div>
                ${bus.actualDeparture || bus.actualArrival ? `
                    <div class="detail-row"><b>Actual Departure:</b> ${bus.actualDeparture || 'N/A'}</div>
                    <div class="detail-row"><b>Actual Arrival:</b> ${bus.actualArrival || 'N/A'}</div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                ${bus.availableSeats > 0 ? `
                    <button class="btn primary" onclick="bookTicket('${bus.busNumber}');this.parentElement.parentElement.parentElement.remove()">Book Now</button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Generate multiple tickets view
function generateMultipleTickets(booking) {
    try {
        if (!booking || !booking.subTickets) {
            console.error('Invalid booking object');
            return '';
        }

        return `
            <div class="booking-summary">
                <div class="booking-header">
                    <h3>Booking Summary</h3>
                    <div class="booking-meta">
                        <div><b>Booking ID:</b> ${booking.ticketNumber}</div>
                        <div><b>Total Amount:</b> ₹${booking.totalPrice}</div>
                        <div><b>Number of Tickets:</b> ${booking.quantity}</div>
                        <div><b>Booking Date:</b> ${booking.bookingDate}</div>
                    </div>
                </div>
                <div class="tickets-container">
                    ${booking.subTickets.map(ticket => `
                        <div class="ticket">
                            <div class="ticket-details">
                                <div><b>Ticket No:</b> ${ticket.ticketNumber}</div>
                                <div><b>Passenger:</b> ${ticket.passengerNum} of ${booking.quantity}</div>
                                <div><b>Seat No:</b> ${ticket.seatNumber}</div>
                                <div><b>Route:</b> ${ticket.from} → ${ticket.to}</div>
                                <div><b>Bus:</b> ${ticket.busName} (${ticket.busNumber})</div>
                                <div><b>Timing:</b> ${ticket.timing}</div>
                                <div><b>Price:</b> ₹${ticket.price}</div>
                                <div><b>Vehicle:</b> ${ticket.vehicle}</div>
                            </div>
                            ${generateQR(ticket)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error in generateMultipleTickets:', error);
        return '<div class="error">Error generating tickets view</div>';
    }
}

// Generate single ticket view
function generateSingleTicket(ticket) {
    try {
        if (!ticket) {
            console.error('Invalid ticket object');
            return '';
        }

        return `
            <div class="ticket">
                <div class="ticket-details">
                    <div><b>Ticket No:</b> ${ticket.ticketNumber}</div>
                    <div><b>Seat No:</b> ${ticket.seatNumber}</div>
                    <div><b>Route:</b> ${ticket.from} → ${ticket.to}</div>
                    <div><b>Bus:</b> ${ticket.busName} (${ticket.busNumber})</div>
                    <div><b>Timing:</b> ${ticket.timing}</div>
                    <div><b>Price:</b> ₹${ticket.price}</div>
                    <div><b>Vehicle:</b> ${ticket.vehicle}</div>
                    <div><b>Booking Date:</b> ${ticket.bookingDate}</div>
                </div>
                ${generateQR(ticket)}
            </div>
        `;
    } catch (error) {
        console.error('Error in generateSingleTicket:', error);
        return '<div class="error">Error generating ticket view</div>';
    }
}

// Handle browser back/forward
window.onpopstate = function(event) {
    try {
        if (event.state && event.state.screen) {
            showScreen(event.state.screen);
        } else {
            // Default to home if no state
            showScreen(SCREENS.HOME);
        }
    } catch (error) {
        console.error('Error handling popstate:', error);
        showScreen(SCREENS.HOME);
    }
};

// ... existing code ...