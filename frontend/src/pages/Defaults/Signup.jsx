import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../Components/Button';
import icons from '../../assets/icons';
import BasicInfoForm from '../../Components/BasicForm';
import RoleBasedForm from '../../Components/RolebasedForm';
import Divider from '../../Components/Divider';
import undrawSignUp from '../../assets/undraw_sign-in_uva0.svg';
import {signup} from '../../../services/servicesApi';

const Signup = () => {
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    user_id: '',
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    enrollmentYear: '',
    currentSemester: '',
    section: '',
    adminKey: '',
    adminPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateBasicForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = userData;
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  const validateRoleForm = () => {
    if (!role) {
      setError('Please select a role.');
      return false;
    }
    if (!userData.department) {
      setError('Department is required.');
      return false;
    }
    if (role === 'student') {
      if (!userData.currentSemester || !userData.section) {
        setError('Semester and Section are required for students.');
        return false;
      }
    }
    if (role === 'admin') {
      if (!userData.adminKey || !userData.adminPassword) {
        setError('Admin Key and Password are required.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const generateUserId = (role) => {
    let prefix = 's';
    if (role === 'faculty') prefix = 'f';
    else if (role === 'admin') prefix = 'a';
    const random = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');
    return `${prefix}${random}`;
  };

  const handleNext = () => {
    if (validateBasicForm()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (step === 1) {
      if (!validateBasicForm()) {
        setIsLoading(false);
        return;
      }
      setStep(2);
      setIsLoading(false);
      return;
    }

    if (!validateRoleForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const generatedId = generateUserId(role);
      const name = `${userData.firstName} ${userData.lastName}`;

      const userPayload = {
        user_id: generatedId,
        name,
        email: userData.email,
        password: userData.password,
        user_type: role,
        department: userData.department,
        semester: role === 'student' ? parseInt(userData.currentSemester) : 0,
        section: role === 'student' ? userData.section : null,
      };

      const response = await signup(userPayload);

      const userDataToStore = {
        user_id: response.user_id,
        name,
        email: userPayload.email,
        user_type: role,
        department: userPayload.department,
        ...(role === 'student' && {
          semester: userPayload.semester,
          section: userPayload.section,
        }),
      };
      
      localStorage.setItem('currentUser', JSON.stringify({ user: userDataToStore }));

      navigate('/dashboard', { state: { user: userDataToStore } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container flex w-[70dvw] h-[80dvh] rounded-2xl shadow-dark'>
      {/* Left Pane */}
      <div className='left relative flex flex-col items-center justify-center h-full w-1/2 rounded-2xl rounded-tr-none rounded-br-none bg-dark-dark-card p-8'>
        <img
          src={undrawSignUp}
          alt='Sign up illustration'
          className='w-[70%] max-h-[50%] object-contain filter grayscale-[20%] hover:grayscale-0 transition-all duration-500 mb-8'
        />
        <div className='text-center z-10 space-y-3'>
          <h2 className='text-4xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent'>
            New Here?
          </h2>
          <p className='text-gray-300/80 text-lg font-light max-w-md'>
            Sign up now and explore the possibilities.
          </p>
        </div>
      </div>

      {/* Right Pane */}
      <div className='right flex flex-col items-center w-1/2 h-full rounded-2xl rounded-tl-none rounded-bl-none bg-dark border-l-2 border-dark-hover'>
        <div className='heading mt-20 mb-40 flex w-[30%] h-14 bg-dark-hover rounded-md justify-center items-center gap-2'>
          <Link to='/login' className='flex w-[45%] h-[80%] rounded-md justify-center items-center'>
            Login
          </Link>
          <Link to='/signup' className='flex w-[45%] h-[80%] rounded-md bg-dark justify-center items-center'>
            Sign-up
          </Link>
        </div>

        <form className='flex flex-col w-[80%] h-[90%] items-center gap-5' onSubmit={handleSubmit}>
          {step === 1 && (
            <BasicInfoForm userData={userData} handleInputChange={handleInputChange} />
          )}

          {step === 2 && (
            <RoleBasedForm role={role} setRole={setRole} userData={userData} handleInputChange={handleInputChange} />
          )}

          <Divider width='70%' />

          <div className='Signups flex justify-center items-center w-[70%]'>
            {step === 1 ? (
              <Button
                width='w-full'
                height='h-12'
                text='Next'
                bgColor='bg-light'
                textColor='text-dark'
                Icon={icons.FaArrowRight}
                onClick={handleNext}
              />
            ) : (
              <Button
                width='w-full'
                height='h-12'
                text={isLoading ? 'Submitting...' : 'Submit'}
                bgColor='bg-light'
                textColor='text-dark'
                Icon={icons.FaArrowRight}
                type='submit'
              />
            )}
          </div>

          {error && <p className='text-red-500 m-4'>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Signup;