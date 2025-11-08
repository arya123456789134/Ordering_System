# API Integration Documentation

## Web Speech API (Speech Synthesis) Integration

### Overview
This document describes the integration of the **Web Speech API (Speech Synthesis)** into the Food Ordering System. This API provides text-to-speech functionality that works completely offline using system voices available on the user's device.

### Integration Details

#### API Information
- **API Name**: Web Speech API - Speech Synthesis
- **Type**: Browser Native API (Offline-capable)
- **Browser Support**: Chrome, Edge, Safari, Firefox (with system voices)
- **Offline Support**: ✅ Yes - Works without internet connection
- **Requirements**: System voices (pre-installed on operating system)

#### Files Created/Modified

1. **New File**: `assets/js/speech-service.js`
   - Contains the `SpeechService` class that wraps the Web Speech API
   - Provides methods for speaking text, announcing order confirmations, etc.
   - Handles voice selection and configuration

2. **Modified File**: `menu.html`
   - Added script tag to include `speech-service.js`
   - Loads the speech service before menu.js

3. **Modified File**: `assets/js/menu.js`
   - Integrated speech announcements for:
     - Items added to cart
     - Order confirmations (with tracking number and total)
   - Added speech toggle button functionality

4. **Modified File**: `assets/css/user.css`
   - Added styling for the speech toggle button
   - Circular orange button with hover effects

### Features

#### 1. Speech Announcements
- **Item Added to Cart**: Announces when an item is added (e.g., "Pizza added to cart")
- **Order Confirmation**: Announces order success with tracking number and total amount
- **Speech Toggle**: Users can enable/disable speech announcements

#### 2. User Interface
- **Speech Toggle Button**: Located in the floating button panel
  - 🔊 Icon when enabled
  - 🔇 Icon when disabled
  - Orange circular button for easy identification

#### 3. Offline Functionality
- Works completely offline - no internet connection required
- Uses system voices pre-installed on the user's device
- No external API calls or dependencies

### Technical Implementation

#### SpeechService Class

The `SpeechService` class provides the following methods:

```javascript
// Check if API is supported
speechService.isSupported()

// Enable/disable speech
speechService.setEnabled(true/false)
speechService.toggle()

// Speak custom text
speechService.speak(text, options)

// Announce order confirmation
speechService.announceOrderConfirmation(orderDetails)

// Announce item added to cart
speechService.announceItemAdded(itemName)

// Stop current speech
speechService.stop()

// Get available voices
speechService.getVoices()
```

#### Configuration Options

Speech utterances can be customized with options:
- `rate`: Speech rate (default: 1.0, range: 0.1 to 10)
- `pitch`: Voice pitch (default: 1.0, range: 0 to 2)
- `volume`: Volume level (default: 1.0, range: 0 to 1)
- `voice`: Specific voice object to use

#### LocalStorage Persistence

The speech service saves the user's preference (enabled/disabled) in localStorage with the key `speechEnabled`. This allows the preference to persist across page reloads.

### Usage Example

```javascript
// Enable speech
speechService.setEnabled(true);

// Announce an item
speechService.announceItemAdded("Pizza");

// Announce order confirmation
speechService.announceOrderConfirmation({
    trackingNumber: "ORD202412011234",
    customerName: "John Doe",
    items: [{name: "Pizza", quantity: 2, price: 10}],
    total: 20
});

// Custom speech with options
speechService.speak("Custom message", {
    rate: 0.9,
    pitch: 1.2,
    volume: 0.8
});
```

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full Support | Uses system voices |
| Safari | ✅ Full Support | Uses system voices |
| Firefox | ✅ Full Support | Uses system voices |
| Opera | ✅ Full Support | Uses system voices |

### Security & Privacy

- **No Data Transmission**: All speech synthesis happens locally on the user's device
- **No External Services**: No data is sent to external servers
- **User Control**: Users can enable/disable speech at any time
- **Browser Permission**: May require microphone permission in some browsers (for consistency checks)

### Benefits

1. **Accessibility**: Makes the ordering system more accessible to users with visual impairments
2. **User Experience**: Provides audio feedback for important actions (order confirmations)
3. **Offline Support**: Works without internet connection
4. **No External Dependencies**: Uses native browser APIs
5. **Lightweight**: No additional libraries or external resources required

### Future Enhancements

Potential improvements for the speech integration:
- Voice selection menu for users to choose preferred voice
- Language selection for multi-language support
- Custom speech messages per order status
- Speech rate/pitch user preferences
- Integration with admin panel for order status announcements

### Testing

To test the integration:

1. Open `menu.html` in a supported browser
2. Look for the orange 🔊 button in the floating button panel
3. Click to enable/disable speech
4. Add items to cart - should hear "Item added to cart"
5. Place an order - should hear order confirmation with tracking number
6. Test offline by disconnecting from internet - speech should still work

### Troubleshooting

**Issue**: Speech not working
- **Solution**: Check browser console for errors. Ensure browser supports Speech Synthesis API.

**Issue**: No voices available
- **Solution**: System may not have speech voices installed. Install system voices through OS settings.

**Issue**: Speech too fast/slow
- **Solution**: Modify the `rate` option in speech service calls (currently hardcoded).

**Issue**: Button not appearing
- **Solution**: Check if `speech-service.js` is loaded correctly. Check browser console for JavaScript errors.

### References

- [MDN Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis API Reference](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [SpeechSynthesisUtterance API Reference](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)

---

**Integration Date**: December 2025  
**Status**: ✅ Complete and Functional  
**Offline Support**: ✅ Yes
