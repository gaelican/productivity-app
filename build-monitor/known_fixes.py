#!/usr/bin/env python3
"""
Known fixes for common React Native 0.73.6 + Expo SDK 50 Android build issues
"""

import os
import re
from auto_fixer import AutoFixer

class KnownFixes:
    """Collection of known fixes for specific libraries and issues"""
    
    @staticmethod
    def fix_watermelondb_namespace():
        """Fix WatermelonDB missing namespace"""
        fixes = [
            {
                'file': 'node_modules/@nozbe/watermelondb/native/android/build.gradle',
                'search': r'android\s*{',
                'add_after': '\n    namespace "com.nozbe.watermelondb"'
            }
        ]
        return fixes
    
    @staticmethod
    def fix_datetimepicker_buildconfig():
        """Fix DateTimePicker BuildConfig issue"""
        fixes = [
            {
                'file': 'node_modules/@react-native-community/datetimepicker/android/build.gradle',
                'search': r'android\s*{',
                'add_after': '\n    buildFeatures {\n        buildConfig = true\n    }'
            }
        ]
        return fixes
    
    @staticmethod
    def fix_common_namespace_issues():
        """Fix namespace issues for common RN libraries"""
        libraries = [
            ('react-native-gesture-handler', 'com.swmansion.gesturehandler'),
            ('react-native-reanimated', 'com.swmansion.reanimated'),
            ('react-native-screens', 'com.swmansion.rnscreens'),
            ('react-native-safe-area-context', 'com.th3rdwave.safeareacontext'),
            ('react-native-svg', 'com.horcrux.svg'),
            ('react-native-async-storage', 'com.reactnativecommunity.asyncstorage'),
            ('react-native-webview', 'com.reactnativecommunity.webview'),
            ('react-native-vector-icons', 'com.oblador.vectoricons'),
            ('react-native-linear-gradient', 'com.BV.LinearGradient'),
            ('react-native-image-picker', 'com.imagepicker'),
            ('react-native-camera', 'org.reactnative.camera'),
            ('react-native-device-info', 'com.learnium.RNDeviceInfo'),
            ('react-native-fs', 'com.rnfs'),
            ('react-native-share', 'cl.json'),
            ('react-native-pdf', 'org.wonday.pdf'),
            ('react-native-document-picker', 'com.reactnativedocumentpicker'),
            ('react-native-permissions', 'com.zoontek.rnpermissions'),
            ('react-native-firebase', 'io.invertase.firebase'),
            ('react-native-maps', 'com.airbnb.android.react.maps'),
            ('react-native-fast-image', 'com.dylanvann.fastimage'),
            ('react-native-keychain', 'com.oblador.keychain'),
            ('react-native-biometrics', 'com.rnbiometrics'),
            ('react-native-splash-screen', 'org.devio.rn.splashscreen'),
            ('react-native-orientation-locker', 'com.github.wonday.orientation'),
            ('react-native-sound', 'com.zmxv.RNSound'),
            ('react-native-video', 'com.brentvatne.react'),
            ('react-native-push-notification', 'com.dieam.reactnativepushnotification'),
            ('react-native-code-push', 'com.microsoft.codepush.react'),
            ('react-native-config', 'com.lugg.ReactNativeConfig'),
            ('react-native-mmkv', 'com.tencent.mmkv'),
            ('react-native-vision-camera', 'com.mrousavy.camera'),
            ('react-native-qrcode-scanner', 'com.reactnativecommunity.rnqrcodescanner'),
            ('@react-native-community/netinfo', 'com.reactnativecommunity.netinfo'),
            ('@react-native-community/slider', 'com.reactnativecommunity.slider'),
            ('@react-native-community/clipboard', 'com.reactnativecommunity.clipboard'),
            ('@react-native-community/blur', 'com.cmcewen.blurview'),
            ('@react-native-community/picker', 'com.reactnativecommunity.picker'),
            ('@react-native-community/checkbox', 'com.reactnativecommunity.checkbox'),
            ('@react-native-community/progress-bar-android', 'com.reactnativecommunity.progressbar'),
            ('@react-native-community/progress-view', 'com.reactnativecommunity.progressview'),
            ('@react-native-community/toolbar-android', 'com.reactnativecommunity.toolbarandroid'),
            ('@react-native-community/viewpager', 'com.reactnativecommunity.viewpager'),
            ('@react-native-masked-view/masked-view', 'org.reactnative.maskedview'),
            ('@react-native-picker/picker', 'com.reactnativecommunity.picker'),
            ('@react-native-async-storage/async-storage', 'com.reactnativecommunity.asyncstorage'),
            ('@react-native-firebase/app', 'io.invertase.firebase.app'),
            ('@react-native-firebase/auth', 'io.invertase.firebase.auth'),
            ('@react-native-firebase/firestore', 'io.invertase.firebase.firestore'),
            ('@react-native-firebase/storage', 'io.invertase.firebase.storage'),
            ('@react-native-firebase/messaging', 'io.invertase.firebase.messaging'),
            ('@react-native-firebase/crashlytics', 'io.invertase.firebase.crashlytics'),
            ('@react-native-firebase/analytics', 'io.invertase.firebase.analytics'),
            ('@shopify/react-native-skia', 'com.shopify.reactnative.skia'),
            ('react-native-worklets-core', 'com.worklets'),
            ('@gorhom/bottom-sheet', 'com.gorhom.bottomsheet'),
            ('@react-navigation/drawer', 'com.reactnavigation.drawer'),
            ('react-native-tab-view', 'com.reactnativecommunity.tabview'),
            ('react-native-pager-view', 'com.reactnativepagerview'),
            ('lottie-react-native', 'com.airbnb.android.lottie'),
            ('react-native-haptic-feedback', 'com.mkuczera'),
            ('react-native-skeleton-placeholder', 'com.reactnativeskeletonplaceholder'),
            ('react-native-super-grid', 'com.reactnativesupergrid'),
            ('react-native-snap-carousel', 'com.reactnativesnapcarousel'),
            ('react-native-collapsible', 'com.oblador.collapsible'),
            ('react-native-modal', 'com.reactnativemodal'),
            ('react-native-shimmer-placeholder', 'com.reactnativeshimmerplaceholder'),
            ('react-native-toast-message', 'com.reactnativetoastmessage'),
            ('react-native-offline', 'com.reactnativeoffline'),
            ('react-native-paper', 'com.reactnativepaper'),
            ('react-native-elements', 'com.reactnativeelements'),
            ('react-native-draggable-flatlist', 'com.reactnativedraggableflatlist'),
            ('react-native-calendar-events', 'com.calendarevents'),
            ('react-native-contacts', 'com.rt2zz.reactnativecontacts'),
            ('react-native-print', 'com.christopherdro.RNPrint'),
            ('react-native-html-to-pdf', 'com.christopherdro.htmltopdf'),
            ('react-native-background-timer', 'com.ocetnik.timer'),
            ('react-native-background-fetch', 'com.transistorsoft.rnbackgroundfetch'),
            ('react-native-background-geolocation', 'com.transistorsoft.rnbackgroundgeolocation'),
            ('react-native-uuid', 'com.reactnativeuuid'),
            ('react-native-get-random-values', 'com.reactnativegetrandomvalues'),
            ('react-native-url-polyfill', 'com.reactnativeurlpolyfill'),
            ('@stripe/stripe-react-native', 'com.stripe.react'),
            ('@sentry/react-native', 'io.sentry.react'),
            ('react-native-in-app-review', 'com.ibits.react_native_in_app_review'),
            ('react-native-rate', 'com.reactnativerate'),
            ('react-native-app-intro-slider', 'com.reactnativeappintroslider'),
            ('react-native-onboarding-swiper', 'com.reactnativeonboardingswiper'),
            ('react-native-swiper', 'com.reactnativeswiper'),
            ('react-native-credit-card-input', 'com.creditcardreactnative'),
            ('react-native-masked-text', 'com.RNMaskedText'),
            ('react-native-material-textfield', 'com.reactnativematerialtextfield'),
            ('react-native-material-menu', 'com.reactnativematerialmenu'),
            ('react-native-popup-menu', 'com.reactnativepopupmenu'),
            ('react-native-action-sheet', 'com.actionsheet'),
            ('react-native-dialog', 'com.aakashns.reactnativedialogs'),
            ('react-native-simple-toast', 'com.reactnativecommunity.rntoast'),
            ('react-native-root-toast', 'com.reactnativeroottoast'),
            ('react-native-snackbar', 'com.azendoo.reactnativesnackbar'),
            ('react-native-flash-message', 'com.reactnativeflashmessage'),
            ('react-native-dropdownalert', 'com.reactnativedropdownalert'),
            ('react-native-loading-spinner-overlay', 'com.reactnativespinkit'),
            ('react-native-progress', 'com.reactnativeprogress'),
            ('react-native-circular-progress', 'com.bartgryszko.reactnativecircularprogress'),
            ('react-native-percentage-circle', 'com.reactnativepercentagecircle'),
            ('react-native-chart-kit', 'com.reactnativechartkit'),
            ('react-native-charts-wrapper', 'com.github.wuxudong.rncharts'),
            ('react-native-gifted-charts', 'com.giftedcharts'),
            ('react-native-calendars', 'com.wix.reactnativecalendars'),
            ('react-native-big-calendar', 'com.reactnativebigcalendar'),
            ('react-native-week-view', 'com.reactnativeweekview'),
            ('react-native-timetable', 'com.reactnativetimetable'),
            ('react-native-signature-canvas', 'com.reactnativesignaturecanvas'),
            ('react-native-signature-capture', 'com.rssignature'),
            ('react-native-sketch-canvas', 'com.terrylinla.rnsketchcanvas'),
            ('react-native-bluetooth-classic', 'com.nuttawutmalee.RCTBluetoothClassic'),
            ('react-native-bluetooth-serial', 'com.rusel.reactnativebluetoothserial'),
            ('react-native-ble-plx', 'com.polidea.reactnativeble'),
            ('react-native-ble-manager', 'com.innoveit.BBSBleManager'),
            ('react-native-nfc-manager', 'community.revteltech.nfc'),
            ('react-native-wifi-reborn', 'com.reactlibrary.rnwifi'),
            ('react-native-thermal-printer', 'com.reactnativethermalprinter'),
            ('react-native-star-prnt', 'com.starprnt'),
            ('react-native-sunmi-printer', 'com.sunmi'),
            ('react-native-tcp-socket', 'com.asterinet.react.tcpsocket'),
            ('react-native-udp', 'com.tradle.react'),
            ('react-native-ping', 'com.reactnativeping'),
            ('react-native-network-info', 'com.pusherman.networkinfo'),
            ('react-native-carrier-info', 'com.ianlin.RNCarrierInfo'),
            ('react-native-phone-number-input', 'com.reactnativephonenumberinput'),
            ('react-native-sms', 'com.rhaker.reactnativesms'),
            ('react-native-sms-retriever', 'com.reactnativesmsretriever'),
            ('react-native-call-detection', 'com.pritesh.calldetection'),
            ('react-native-incoming-call', 'com.incomingcall'),
            ('react-native-callkeep', 'io.wazo.callkeep'),
            ('react-native-voip-push-notification', 'com.reactnativevoippushnotification'),
            ('react-native-twilio-video-webrtc', 'com.twiliorn.library'),
            ('react-native-webrtc', 'com.oney.WebRTCModule'),
            ('react-native-agora', 'io.agora.rtc.react'),
            ('react-native-jitsi-meet', 'org.jitsi.meet'),
            ('react-native-zoom-us', 'com.reactnativezoomus'),
            ('react-native-daily-js', 'co.daily.reactnative'),
            ('react-native-live-stream', 'com.reactnativelivestream'),
            ('react-native-rtmp-publisher', 'com.reactnativertmppublisher'),
            ('react-native-nodemediaclient', 'com.nodemediaclient'),
            ('react-native-photoview', 'com.reactnative.photoview'),
            ('react-native-photo-editor', 'com.ahmedadeltito.photoeditor'),
            ('react-native-image-crop-picker', 'com.reactnative.ivpusic.imagepicker'),
            ('react-native-image-resizer', 'com.reactnativeimageresizer'),
            ('react-native-image-editor', 'com.reactnativecommunity.imageeditor'),
            ('react-native-image-zoom-viewer', 'com.reactnativeimagezoomviewer'),
            ('react-native-perspective-image-cropper', 'com.reactnativeperspectiveimagecropper'),
            ('@baronha/react-native-multiple-image-picker', 'com.reactnativemultipleimagepicker'),
        ]
        
        fixes = []
        for lib_name, namespace in libraries:
            # Try different possible paths
            paths = [
                f'node_modules/{lib_name}/android/build.gradle',
                f'node_modules/{lib_name}/android/app/build.gradle',
                f'node_modules/{lib_name}/src/android/build.gradle',
            ]
            
            for path in paths:
                if os.path.exists(path):
                    fixes.append({
                        'file': path,
                        'search': r'android\s*{',
                        'add_after': f'\n    namespace "{namespace}"'
                    })
                    break
                    
        return fixes
    
    @staticmethod
    def fix_kotlin_versions():
        """Align Kotlin versions across the project"""
        return [
            {
                'file': 'android/build.gradle',
                'search': r'kotlinVersion\s*=\s*["\'][\d.]+["\']',
                'replace': 'kotlinVersion = "1.9.0"'
            }
        ]
    
    @staticmethod
    def fix_repositories():
        """Ensure all required repositories are configured"""
        repos_to_add = [
            "google()",
            "mavenCentral()",
            "maven { url 'https://www.jitpack.io' }",
            "maven { url 'https://maven.google.com' }",
        ]
        
        fixes = []
        for repo in repos_to_add:
            fixes.append({
                'file': 'android/build.gradle',
                'section': 'allprojects { repositories {',
                'add_if_missing': repo
            })
            
        return fixes
    
    @staticmethod
    def apply_all_known_fixes():
        """Apply all known fixes"""
        print("Applying known fixes for React Native 0.73.6 + Expo SDK 50...")
        
        # Apply specific fixes
        print("\n1. Fixing WatermelonDB namespace...")
        for fix in KnownFixes.fix_watermelondb_namespace():
            apply_file_fix(fix)
            
        print("\n2. Fixing DateTimePicker BuildConfig...")
        for fix in KnownFixes.fix_datetimepicker_buildconfig():
            apply_file_fix(fix)
            
        print("\n3. Fixing common library namespaces...")
        namespace_fixes = KnownFixes.fix_common_namespace_issues()
        print(f"   Found {len(namespace_fixes)} libraries to fix")
        for fix in namespace_fixes:
            apply_file_fix(fix)
            
        print("\n4. Aligning Kotlin versions...")
        for fix in KnownFixes.fix_kotlin_versions():
            apply_file_fix(fix)
            
        print("\n5. Ensuring repositories are configured...")
        for fix in KnownFixes.fix_repositories():
            apply_file_fix(fix)
            
        print("\nKnown fixes applied!")

def apply_file_fix(fix: dict):
    """Apply a single file fix"""
    file_path = fix['file']
    
    if not os.path.exists(file_path):
        return
        
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        modified = False
        
        if 'add_after' in fix:
            # Check if already exists
            if fix['add_after'].strip() not in content:
                # Find position and insert
                match = re.search(fix['search'], content)
                if match:
                    pos = match.end()
                    content = content[:pos] + fix['add_after'] + content[pos:]
                    modified = True
                    
        elif 'replace' in fix:
            # Replace pattern
            new_content = re.sub(fix['search'], fix['replace'], content)
            if new_content != content:
                content = new_content
                modified = True
                
        elif 'add_if_missing' in fix:
            # Add if not present
            if fix['add_if_missing'] not in content:
                # Find section
                section_match = re.search(fix['section'], content)
                if section_match:
                    # Find closing brace
                    pos = content.find('}', section_match.end())
                    if pos > 0:
                        content = content[:pos] + f"\n        {fix['add_if_missing']}\n    " + content[pos:]
                        modified = True
                        
        if modified:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"   Fixed: {file_path}")
            
    except Exception as e:
        print(f"   Error fixing {file_path}: {e}")

if __name__ == "__main__":
    KnownFixes.apply_all_known_fixes()