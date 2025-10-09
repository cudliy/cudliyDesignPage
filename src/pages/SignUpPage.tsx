import SignUp from "@/components/SignUp";
import SEO from "@/components/SEO";

const SignUpPage = () => {
  return (
    <>
      <SEO 
        title="Sign Up - Start Creating Custom Toys"
        description="Join Cudliy and start designing your own custom 3D toys. Free account includes 3 image generations per month. Sign up now and bring your ideas to life!"
        keywords="sign up, register, create account, join cudliy, free trial, toy design account"
        url="/signup"
      />
      <SignUp />
    </>
  );
};

export default SignUpPage;


