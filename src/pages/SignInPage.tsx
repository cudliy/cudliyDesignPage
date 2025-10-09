import SignIn from "@/components/SignIn";
import SEO from "@/components/SEO";

const SignInPage = () => {
  return (
    <>
      <SEO 
        title="Sign In - Access Your Design Dashboard"
        description="Sign in to Cudliy to access your custom toy designs, manage your creations, and continue bringing your imagination to life."
        keywords="sign in, login, user account, dashboard access, toy designs"
        url="/signin"
      />
      <SignIn />
    </>
  );
};

export default SignInPage;


