import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  // Use the simplest possible configuration to avoid type errors
  // The default settings will create a Cognito User Pool with email login
  loginWith: {
    email: true,
  }
});

// Note: Additional configuration like custom attributes can be added
// through the AWS Console after deployment
