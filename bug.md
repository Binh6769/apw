react-dom_client.js?v=d349cc18:20103 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
react-dom_client.js?v=d349cc18:336 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
warnInvalidHookAccess @ react-dom_client.js?v=d349cc18:336
react-dom_client.js?v=d349cc18:336 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
warnInvalidHookAccess @ react-dom_client.js?v=d349cc18:336
react-dom_client.js?v=d349cc18:5594 React has detected a change in the order of Hooks called by MasonryGridComponent. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useContext                 useContext
2. useState                   useState
3. useEffect                  useEffect
4. useState                   useState
5. useEffect                  useEffect
6. useCallback                useCallback
7. useMemo                    useMemo
8. useMemo                    useMemo
9. useMemo                    useCallback
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

updateHookTypesDev @ react-dom_client.js?v=d349cc18:5594
react-dom_client.js?v=d349cc18:5628 The final argument passed to useCallback changed size between renders. The order and size of this array must remain constant.

Previous: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 2]
Incoming: [(photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  }]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:5628 The final argument passed to useCallback changed size between renders. The order and size of this array must remain constant.

Previous: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 2]
Incoming: []
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:336 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
warnInvalidHookAccess @ react-dom_client.js?v=d349cc18:336
react-dom_client.js?v=d349cc18:5628 The final argument passed to useMemo changed size between renders. The order and size of this array must remain constant.

Previous: [(photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  }]
Incoming: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:336 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
warnInvalidHookAccess @ react-dom_client.js?v=d349cc18:336
react-dom_client.js?v=d349cc18:5628 The final argument passed to useMemo changed size between renders. The order and size of this array must remain constant.

Previous: []
Incoming: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:5628 The final argument passed to useCallback changed size between renders. The order and size of this array must remain constant.

Previous: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
Incoming: [(photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  }]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:5628 The final argument passed to useCallback changed size between renders. The order and size of this array must remain constant.

Previous: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
Incoming: []
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:336 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
warnInvalidHookAccess @ react-dom_client.js?v=d349cc18:336
react-dom_client.js?v=d349cc18:5628 The final argument passed to useMemo changed size between renders. The order and size of this array must remain constant.

Previous: [(photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  }]
Incoming: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:336 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
warnInvalidHookAccess @ react-dom_client.js?v=d349cc18:336
react-dom_client.js?v=d349cc18:5628 The final argument passed to useMemo changed size between renders. The order and size of this array must remain constant.

Previous: []
Incoming: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:5628 The final argument passed to useCallback changed size between renders. The order and size of this array must remain constant.

Previous: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
Incoming: [(photo) => {
    const photoWithId = { ...photo, _imageId: photo.id };
    navigate(`/pin/${photo.id}`, { state: { photo: photoWithId } });
  }]
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:5628 The final argument passed to useCallback changed size between renders. The order and size of this array must remain constant.

Previous: [[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object], 6]
Incoming: []
areHookInputsEqual @ react-dom_client.js?v=d349cc18:5628
react-dom_client.js?v=d349cc18:7001 Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at finishRenderingHooks (react-dom_client.js?v=d349cc18:5697:17)
    at renderWithHooks (react-dom_client.js?v=d349cc18:5675:9)
    at updateFunctionComponent (react-dom_client.js?v=d349cc18:7475:21)
    at beginWork (react-dom_client.js?v=d349cc18:8525:20)
    at runWithFiberInDEV (react-dom_client.js?v=d349cc18:999:15)
    at performUnitOfWork (react-dom_client.js?v=d349cc18:12561:98)
    at workLoopSync (react-dom_client.js?v=d349cc18:12424:43)
    at renderRootSync (react-dom_client.js?v=d349cc18:12408:13)
    at performWorkOnRoot (react-dom_client.js?v=d349cc18:11827:37)
    at performWorkOnRootViaSchedulerTask (react-dom_client.js?v=d349cc18:13505:9)

The above error occurred in the <MasonryGridComponent> component.

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.

defaultOnCaughtError @ react-dom_client.js?v=d349cc18:7001
ErrorBoundary.tsx:24 Uncaught error: Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at finishRenderingHooks (react-dom_client.js?v=d349cc18:5697:17)
    at renderWithHooks (react-dom_client.js?v=d349cc18:5675:9)
    at updateFunctionComponent (react-dom_client.js?v=d349cc18:7475:21)
    at beginWork (react-dom_client.js?v=d349cc18:8525:20)
    at runWithFiberInDEV (react-dom_client.js?v=d349cc18:999:15)
    at performUnitOfWork (react-dom_client.js?v=d349cc18:12561:98)
    at workLoopSync (react-dom_client.js?v=d349cc18:12424:43)
    at renderRootSync (react-dom_client.js?v=d349cc18:12408:13)
    at performWorkOnRoot (react-dom_client.js?v=d349cc18:11827:37)
    at performWorkOnRootViaSchedulerTask (react-dom_client.js?v=d349cc18:13505:9) Object
componentDidCatch @ ErrorBoundary.tsx:24
