// Automated E2E Test Script for Chat Application
// This script can be run directly in the browser console

const TestRunner = {
    results: [],
    stats: { total: 0, passed: 0, failed: 0, warnings: 0 },

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, message, type };
        this.results.push(logEntry);
        this.stats.total++;
        
        if (type === 'success') {
            this.stats.passed++;
            console.log(`✅ [${timestamp}] ${message}`);
        } else if (type === 'failure') {
            this.stats.failed++;
            console.error(`❌ [${timestamp}] ${message}`);
        } else if (type === 'warning') {
            this.stats.warnings++;
            console.warn(`⚠️ [${timestamp}] ${message}`);
        } else {
            console.log(`ℹ️ [${timestamp}] ${message}`);
        }
    },

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async testBasicChat() {
        this.log('Testing Basic Chat Functionality...', 'info');
        
        try {
            // Find message input
            const messageInput = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]');
            if (!messageInput) {
                this.log('Message input field not found', 'failure');
                return false;
            }
            this.log('Message input field found', 'success');

            // Enter test message
            messageInput.value = "Hello, can you help me with coding?";
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.log('Test message entered', 'success');

            // Find send button
            const sendButton = document.querySelector('button svg path[d*="M2.01 21L23"]')?.closest('button') ||
                              document.querySelector('button[aria-label*="Send"]');
            
            if (sendButton) {
                // Store initial message count
                const initialMessages = document.querySelectorAll('[class*="message"], [class*="bubble"]').length;
                
                sendButton.click();
                this.log('Send button clicked', 'success');
                
                // Wait for response
                await this.wait(5000);
                
                // Check if new messages appeared
                const currentMessages = document.querySelectorAll('[class*="message"], [class*="bubble"]').length;
                if (currentMessages > initialMessages) {
                    this.log(`New messages appeared (${currentMessages - initialMessages} new)`, 'success');
                    
                    // Check for timestamps
                    const timestamps = document.querySelectorAll('[class*="time"], [class*="timestamp"]');
                    if (timestamps.length > 0) {
                        this.log('Timestamps are displayed', 'success');
                    } else {
                        this.log('No timestamps found', 'warning');
                    }
                    
                    // Check message formatting
                    const messageElements = document.querySelectorAll('[class*="prose"], [class*="markdown"]');
                    if (messageElements.length > 0) {
                        this.log('Message formatting (markdown) detected', 'success');
                    }
                    
                    return true;
                } else {
                    this.log('No new messages appeared after sending', 'warning');
                    return false;
                }
            } else {
                // Try Enter key
                const enterEvent = new KeyboardEvent('keydown', { 
                    key: 'Enter', 
                    keyCode: 13, 
                    bubbles: true 
                });
                messageInput.dispatchEvent(enterEvent);
                this.log('Tried Enter key (send button not found)', 'warning');
                
                await this.wait(5000);
                return true;
            }
        } catch (error) {
            this.log(`Basic chat test error: ${error.message}`, 'failure');
            return false;
        }
    },

    async testModelSelection() {
        this.log('Testing Model Selection...', 'info');
        
        try {
            // Find model selector (could be button with "GPT-4.1" text)
            const modelSelector = document.querySelector('button:has-text("GPT"), [class*="model"] button') ||
                                 Array.from(document.querySelectorAll('button')).find(btn => 
                                     btn.textContent.includes('GPT-'));
            
            if (!modelSelector) {
                this.log('Model selector not found', 'failure');
                return false;
            }
            
            this.log('Model selector found', 'success');
            modelSelector.click();
            await this.wait(1000);
            
            // Look for model options
            const modelOptions = document.querySelectorAll('[role="option"], [class*="option"], button[class*="model"]');
            const models = ['GPT-4', 'GPT-4.1', 'GPT-5', 'GPT-5 Pro'];
            
            let foundModels = 0;
            models.forEach(model => {
                const found = Array.from(modelOptions).some(opt => 
                    opt.textContent.includes(model)
                );
                if (found) {
                    this.log(`Model option found: ${model}`, 'success');
                    foundModels++;
                } else {
                    this.log(`Model option not found: ${model}`, 'warning');
                }
            });
            
            // Test GPT-5 reasoning controls
            const gpt5Option = Array.from(modelOptions).find(opt => 
                opt.textContent.includes('GPT-5')
            );
            
            if (gpt5Option) {
                gpt5Option.click();
                await this.wait(1000);
                
                // Look for reasoning effort controls
                const reasoningControls = document.querySelectorAll('[class*="reasoning"], [class*="effort"]');
                if (reasoningControls.length > 0) {
                    this.log('Reasoning effort controls found for GPT-5', 'success');
                    
                    const efforts = ['Low', 'Medium', 'High'];
                    efforts.forEach(effort => {
                        const found = Array.from(document.body.querySelectorAll('*')).some(el => 
                            el.textContent.includes(effort) && 
                            (el.className.includes('reasoning') || el.className.includes('effort'))
                        );
                        if (found) {
                            this.log(`Reasoning effort option: ${effort}`, 'success');
                        }
                    });
                } else {
                    this.log('No reasoning effort controls found for GPT-5', 'warning');
                }
            }
            
            // Close selector if still open
            document.body.click();
            await this.wait(500);
            
            return foundModels > 0;
        } catch (error) {
            this.log(`Model selection test error: ${error.message}`, 'failure');
            return false;
        }
    },

    async testVoiceFeatures() {
        this.log('Testing Voice Features...', 'info');
        
        try {
            // Find microphone button
            const micButton = document.querySelector('button svg path[d*="M12 14c1.66"]')?.closest('button') ||
                             document.querySelector('button[aria-label*="mic"], button[aria-label*="voice"], button[aria-label*="record"]');
            
            if (!micButton) {
                this.log('Microphone button not found', 'failure');
                return false;
            }
            
            this.log('Microphone button found', 'success');
            
            // Get initial state
            const initialClasses = micButton.className;
            const initialColor = window.getComputedStyle(micButton).backgroundColor;
            
            // Click to start recording
            micButton.click();
            await this.wait(1000);
            
            // Check if button changed appearance
            const recordingClasses = micButton.className;
            const recordingColor = window.getComputedStyle(micButton).backgroundColor;
            
            if (initialClasses !== recordingClasses || initialColor !== recordingColor) {
                this.log('Microphone button changes appearance when recording', 'success');
            } else {
                this.log('Microphone button appearance did not change', 'warning');
            }
            
            // Check for recording UI
            const recordingUI = document.querySelector('[class*="recording"], [class*="record"], [class*="fab-expanded"]');
            if (recordingUI) {
                this.log('Recording UI appears', 'success');
                
                // Check for timer or indicator
                const timer = document.querySelector('[class*="timer"], [class*="duration"]');
                if (timer) {
                    this.log('Recording timer/duration indicator found', 'success');
                }
            } else {
                this.log('Recording UI not clearly visible', 'warning');
            }
            
            // Stop recording
            await this.wait(2000);
            micButton.click();
            await this.wait(500);
            
            this.log('Voice recording workflow completed', 'success');
            return true;
            
        } catch (error) {
            this.log(`Voice features test error: ${error.message}`, 'failure');
            return false;
        }
    },

    async testMenuOptions() {
        this.log('Testing Menu Options...', 'info');
        
        try {
            // Find menu button (three dots)
            const menuButton = document.querySelector('button svg path[d*="M12 8c1.1"]')?.closest('button') ||
                              document.querySelector('button[aria-label*="menu"], button[aria-label*="options"], button[aria-label*="more"]');
            
            if (!menuButton) {
                this.log('Menu button not found', 'failure');
                return false;
            }
            
            this.log('Menu button found', 'success');
            
            const menuItems = ['Settings', 'Memories', 'Tools Settings', 'MCP Servers', 'Clear Chat'];
            let foundItems = 0;
            
            for (const item of menuItems) {
                // Open menu
                menuButton.click();
                await this.wait(500);
                
                // Find menu item
                const menuOption = Array.from(document.querySelectorAll('button, [role="menuitem"]')).find(el => 
                    el.textContent.trim() === item || el.textContent.includes(item)
                );
                
                if (menuOption) {
                    this.log(`Menu option found: ${item}`, 'success');
                    foundItems++;
                    
                    // Click the option
                    menuOption.click();
                    await this.wait(1000);
                    
                    // Check what opened
                    if (item === 'Settings') {
                        const settingsPanel = document.querySelector('[class*="settings"], [role="dialog"]');
                        if (settingsPanel) {
                            this.log('Settings panel opened', 'success');
                            
                            // Check for settings content
                            const toggles = settingsPanel.querySelectorAll('input[type="checkbox"], [role="switch"]');
                            if (toggles.length > 0) {
                                this.log(`Settings panel has ${toggles.length} toggle options`, 'success');
                            }
                            
                            // Close panel
                            const closeBtn = settingsPanel.querySelector('button[aria-label*="close"], button svg path[d*="M19 6.41"]')?.closest('button');
                            if (closeBtn) {
                                closeBtn.click();
                                await this.wait(500);
                            }
                        }
                    } else if (item === 'Clear Chat') {
                        const confirmDialog = document.querySelector('[role="dialog"], [class*="confirm"], [class*="modal"]');
                        if (confirmDialog) {
                            this.log('Clear chat confirmation dialog appeared', 'success');
                            
                            // Cancel action
                            const cancelBtn = confirmDialog.querySelector('button:has-text("Cancel"), button:has-text("No")') ||
                                            Array.from(confirmDialog.querySelectorAll('button')).find(btn => 
                                                btn.textContent.includes('Cancel') || btn.textContent.includes('No')
                                            );
                            if (cancelBtn) {
                                cancelBtn.click();
                                await this.wait(500);
                            }
                        }
                    } else {
                        // For other panels, just check if something opened
                        const panel = document.querySelector('[role="dialog"], [class*="panel"], [class*="sheet"]');
                        if (panel) {
                            this.log(`${item} panel opened`, 'success');
                            
                            // Close it
                            const closeBtn = panel.querySelector('button[aria-label*="close"], button svg path[d*="M19 6.41"]')?.closest('button');
                            if (closeBtn) {
                                closeBtn.click();
                                await this.wait(500);
                            }
                        }
                    }
                } else {
                    this.log(`Menu option not found: ${item}`, 'warning');
                }
            }
            
            return foundItems > 0;
            
        } catch (error) {
            this.log(`Menu options test error: ${error.message}`, 'failure');
            return false;
        }
    },

    async testErrorHandling() {
        this.log('Testing Error Handling...', 'info');
        
        try {
            // Test 1: Empty message
            const messageInput = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]');
            if (messageInput) {
                messageInput.value = '';
                messageInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                const sendButton = document.querySelector('button svg path[d*="M2.01 21L23"]')?.closest('button');
                if (sendButton) {
                    const initialCount = document.querySelectorAll('[class*="message"]').length;
                    sendButton.click();
                    await this.wait(1000);
                    
                    const afterCount = document.querySelectorAll('[class*="message"]').length;
                    if (afterCount === initialCount) {
                        this.log('Empty message prevented from sending', 'success');
                    } else {
                        this.log('Empty message may have been sent', 'warning');
                    }
                }
            }
            
            // Test 2: Check for error states
            const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="danger"]');
            this.log(`Found ${errorElements.length} potential error display elements`, 'info');
            
            return true;
            
        } catch (error) {
            this.log(`Error handling test error: ${error.message}`, 'failure');
            return false;
        }
    },

    async testUIElements() {
        this.log('Testing UI/UX Elements...', 'info');
        
        try {
            // Test 1: Welcome screen
            const welcomeElements = document.querySelectorAll('h1, h2, h3, [class*="welcome"]');
            const hasWelcome = Array.from(welcomeElements).some(el => 
                el.textContent.toLowerCase().includes('welcome') || 
                el.textContent.toLowerCase().includes('how can i help') ||
                el.textContent.toLowerCase().includes('hi,')
            );
            
            if (hasWelcome) {
                this.log('Welcome screen/message present', 'success');
            } else {
                this.log('Welcome screen not clearly visible', 'warning');
            }
            
            // Test 2: Animations
            const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"], [class*="motion"]');
            if (animatedElements.length > 0) {
                this.log(`Found ${animatedElements.length} animated elements`, 'success');
            } else {
                this.log('No animated elements detected', 'warning');
            }
            
            // Test 3: Responsive classes
            const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"], [class*="mobile"]');
            if (responsiveElements.length > 0) {
                this.log(`Responsive design: ${responsiveElements.length} responsive elements found`, 'success');
            }
            
            // Test 4: Accessibility
            const ariaElements = document.querySelectorAll('[aria-label], [role], [alt]');
            if (ariaElements.length > 10) {
                this.log(`Good accessibility: ${ariaElements.length} ARIA/accessible elements`, 'success');
            } else if (ariaElements.length > 0) {
                this.log(`Basic accessibility: ${ariaElements.length} ARIA elements`, 'warning');
            } else {
                this.log('No accessibility attributes found', 'failure');
            }
            
            // Test 5: Color scheme
            const rootStyles = window.getComputedStyle(document.documentElement);
            const bgColor = rootStyles.backgroundColor || window.getComputedStyle(document.body).backgroundColor;
            this.log(`Color scheme - Background: ${bgColor}`, 'info');
            
            // Test 6: Dark mode
            const darkModeElements = document.querySelectorAll('[class*="dark"], [data-theme]');
            if (darkModeElements.length > 0) {
                this.log('Dark mode support detected', 'success');
            }
            
            return true;
            
        } catch (error) {
            this.log(`UI elements test error: ${error.message}`, 'failure');
            return false;
        }
    },

    async runAllTests() {
        console.clear();
        console.log('%c🧪 E2E Test Suite Started', 'font-size: 20px; color: #667eea; font-weight: bold;');
        console.log('═'.repeat(50));
        
        this.results = [];
        this.stats = { total: 0, passed: 0, failed: 0, warnings: 0 };
        
        // Run all tests
        await this.testBasicChat();
        await this.wait(2000);
        
        await this.testModelSelection();
        await this.wait(2000);
        
        await this.testVoiceFeatures();
        await this.wait(2000);
        
        await this.testMenuOptions();
        await this.wait(2000);
        
        await this.testErrorHandling();
        await this.wait(2000);
        
        await this.testUIElements();
        
        // Generate report
        console.log('═'.repeat(50));
        console.log('%c📊 Test Results Summary', 'font-size: 16px; color: #764ba2; font-weight: bold;');
        console.log(`Total Tests: ${this.stats.total}`);
        console.log(`✅ Passed: ${this.stats.passed}`);
        console.log(`❌ Failed: ${this.stats.failed}`);
        console.log(`⚠️ Warnings: ${this.stats.warnings}`);
        
        const successRate = ((this.stats.passed / this.stats.total) * 100).toFixed(1);
        
        if (successRate > 80) {
            console.log(`%c🎉 SUCCESS RATE: ${successRate}%`, 'color: green; font-size: 18px; font-weight: bold;');
        } else if (successRate > 60) {
            console.log(`%c⚠️ SUCCESS RATE: ${successRate}%`, 'color: orange; font-size: 18px; font-weight: bold;');
        } else {
            console.log(`%c❌ SUCCESS RATE: ${successRate}%`, 'color: red; font-size: 18px; font-weight: bold;');
        }
        
        console.log('═'.repeat(50));
        
        // Return full report
        return {
            stats: this.stats,
            successRate: successRate,
            results: this.results
        };
    }
};

// Make globally available
window.TestRunner = TestRunner;

// Auto-run if in development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
    console.log('%c🧪 E2E Test Runner Loaded!', 'font-size: 16px; color: #667eea;');
    console.log('Run: TestRunner.runAllTests() to start testing');
    console.log('Individual tests available:');
    console.log('  - TestRunner.testBasicChat()');
    console.log('  - TestRunner.testModelSelection()');
    console.log('  - TestRunner.testVoiceFeatures()');
    console.log('  - TestRunner.testMenuOptions()');
    console.log('  - TestRunner.testErrorHandling()');
    console.log('  - TestRunner.testUIElements()');
}