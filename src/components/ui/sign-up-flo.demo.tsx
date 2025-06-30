import SignUp from "../SignUp";

const DemoSignUp = () => {
  const handleLoginClick = () => {
    console.log('Navigate to login');
  };

  const handleSuccess = () => {
    console.log('Sign up successful');
  };

  return (
    <SignUp 
      onLoginClick={handleLoginClick}
      onSuccess={handleSuccess}
    />
  );
};

export { DemoSignUp }; 