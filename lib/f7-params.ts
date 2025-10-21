// Framework7 App Parameters
import { Framework7Parameters } from 'framework7/types';

export const f7params: Framework7Parameters = {
  // App Name
  name: 'AI Chat Assistant',
  
  // Theme - Android Material Design
  theme: 'md',
  
  // Dark mode
  darkMode: false,
  
  // Colors
  colors: {
    primary: '#9c27b0', // Purple - Material You violet
    primaryLight: '#ba68c8',
    primaryDark: '#7b1fa2',
    accent: '#e91e63',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
  },
  
  // Touch settings for better mobile experience
  touch: {
    tapHold: true,
    tapHoldDelay: 750,
    iosTouchRipple: false,
    mdTouchRipple: true,
    disableContextMenu: true,
  },
  
  // Transitions
  view: {
    transition: 'f7-parallax',
    iosDynamicNavbar: false,
    mdPageLoadDelay: 0,
  },
  
  // Dialog settings
  dialog: {
    buttonOk: 'OK',
    buttonCancel: 'Cancel',
    usernamePlaceholder: 'Your name',
    preloaderTitle: 'Loading...',
    progressTitle: 'Loading...',
    destroyPredefinedDialogs: true,
  },
  
  // Statusbar
  statusbar: {
    enabled: true,
    scrollTopOnClick: true,
    iosTextColor: 'white',
    androidTextColor: 'white',
    androidOverlaysWebView: true,
  },
  
  // Navbar
  navbar: {
    hideOnPageScroll: false,
    showOnPageScrollEnd: true,
    showOnPageScrollTop: true,
    scrollTopOnTitleClick: true,
    iosCenterTitle: false,
    mdCenterTitle: false,
  },
  
  // Toolbar
  toolbar: {
    hideOnPageScroll: false,
    showOnPageScrollEnd: false,
    showOnPageScrollTop: false,
  },
  
  // Input
  input: {
    scrollIntoViewOnFocus: true,
    scrollIntoViewCentered: true,
  },
  
  // Service Worker for PWA
  serviceWorker: {
    path: '/service-worker.js',
    scope: '/',
  },
};