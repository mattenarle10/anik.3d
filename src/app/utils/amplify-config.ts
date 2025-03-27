// Simple Amplify configuration file
import { Amplify } from 'aws-amplify';

// Initialize Amplify with direct values and explicitly enable email login
export const configureAmplify = () => {
  // First, log the configuration we're using to help with debugging
  console.log('Configuring Amplify with:', {
    userPoolId: 'us-east-2_i8caRIoEH',
    userPoolClientId: '684uag9acvpmr2u36rba77elgm',
  });
  
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'us-east-2_i8caRIoEH',
        userPoolClientId: '684uag9acvpmr2u36rba77elgm',
        loginWith: {
          email: true,
        },
      }
    }
  });
  
  console.log('Amplify configuration complete');
};
