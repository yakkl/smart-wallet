## Components

This directory contains all the components used in the wallet application.

### on... Callbacks

- onComplete: Called when the user has completed the action and sending back the result. NOTE: This will have different parameters due to the different actions.
- onCancel: Called when the user has canceled the action. This is optional and a default action will be taken if not provided. Use this to handle the cancel action in a custom way. We use this for registration since if the user does not complete the registration, we need to handle it differently.
- onError: Called when an error occurs. This is optional and a default action will be taken if not provided. Use this to handle the error in a custom way. We use for registration since if the user does not complete the registration, we need to handle it differently.
- onSubmit: Called when the user has submitted the form. This is optional and a default action will be taken if not provided. Use this to handle the submit action in a custom way. 

### Events

We use events to communicate between components or when we need to trigger some action where a callback would not easily work.

### Props

- on:close - This is used to trigger an action such as changing 'show' to false in a modal so that it passes the show binding to the parent of the component because another action may have occurred in the child and not pass an onCancel or onComplete callback. This is used in the `Modal` component. 

#### Disclaimer

This is a work in progress and will be updated as we go along. Also, there are a number of components are not yet documented and may not conform to the above standards. We are working on it.

