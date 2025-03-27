import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
    },
    // Optional attributes that can be added
    name: {
      required: false,
    },
    shipping_address: {
      required: false,
    },
    phone_number: {
      required: false,
    },
    date_created: {
      required: false,
    },
  },
  // Configure verification method
  verificationEmailSubject: 'Your verification code',
  signUpVerificationMethod: 'code',
  // Configure password requirements
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true,
  },
});

// Note: Additional configuration like custom attributes can be added
// through the AWS Console after deployment
