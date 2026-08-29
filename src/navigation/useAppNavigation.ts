import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  pageToPath,
  pathnameToPageId,
  parsePathParams,
  type NavigateOptions,
  type PageId,
} from './routes';

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPageId = pathnameToPageId(location.pathname);
  const pathParams = parsePathParams(location.pathname);

  const navigateToPage = useCallback(
    (page: PageId, clientId?: string, contractId?: string) => {
      navigate(pageToPath(page, clientId, contractId));
    },
    [navigate]
  );

  const navigateWithOptions = useCallback(
    (options: NavigateOptions) => {
      navigate(pageToPath(options.page, options.clientId, options.contractId));
    },
    [navigate]
  );

  const goToClientsNav = useCallback(() => {
    if (currentPageId === 'contract-detail' && pathParams.clientId) {
      navigate(pathsClient(pathParams.clientId));
      return;
    }
    if (currentPageId === 'create-invoice') {
      if (pathParams.contractId && pathParams.clientId) {
        navigate(pageToPath('contract-detail', pathParams.clientId, pathParams.contractId));
        return;
      }
      if (pathParams.clientId) {
        navigate(pageToPath('client-detail', pathParams.clientId));
        return;
      }
    }
    navigate(pageToPath('clients'));
  }, [currentPageId, navigate, pathParams.clientId, pathParams.contractId]);

  return {
    navigate,
    navigateToPage,
    navigateWithOptions,
    goToClientsNav,
    currentPageId,
    pathParams,
    pathname: location.pathname,
  };
}

function pathsClient(clientId: string) {
  return pageToPath('client-detail', clientId);
}

/** Dispatch legacy navigate events from components not yet using the hook. */
export function dispatchNavigate(options: NavigateOptions) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: options }));
}
