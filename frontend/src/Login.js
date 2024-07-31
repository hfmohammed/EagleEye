import React from 'react';
import styled from 'styled-components';

const LoginPageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const LoginForm = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  box-sizing: border-box;
`;

const Title = styled.h2`
  margin-bottom: 2rem;
  text-align: center;
`;

const FormField = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  box-sizing: border-box;
  &:hover {
    background-color: #0056b3;
  }
`;

const LoginPage = () => {
  return (
    <LoginPageContainer>
      <LoginForm>
        <Title>Login</Title>
        <form>
          <FormField>
            <Input type="email" placeholder="Email" required />
          </FormField>
          <FormField>
            <Input type="password" placeholder="Password" required />
          </FormField>
          <FormField>
            <Button type="submit">Login</Button>
          </FormField>
        </form>
      </LoginForm>
    </LoginPageContainer>
  );
};

export default LoginPage;
