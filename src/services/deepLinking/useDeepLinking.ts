import { useEffect, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { DeepLinkHandler } from './DeepLinkHandler';

export function useDeepLinking(navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>) {
  const deepLinkHandlerRef = useRef<DeepLinkHandler>();

  useEffect(() => {
    if (!navigationRef.current) {
      return;
    }

    // Create deep link handler instance
    deepLinkHandlerRef.current = new DeepLinkHandler(navigationRef);

    // Handle initial URL (when app is opened via deep link)
    deepLinkHandlerRef.current.setupInitialUrl();

    // Set up listener for incoming deep links (when app is already open)
    const subscription = deepLinkHandlerRef.current.setupListener();

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  return deepLinkHandlerRef.current;
}