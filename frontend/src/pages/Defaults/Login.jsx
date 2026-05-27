import React, { useState } from 'react';
import icons from '../../assets/icons';
import { Link } from 'react-router-dom';
import InputField from '../../Components/InputFeild';
import Button from '../../Components/Button';
import Divider from '../../Components/Divider';
import undraw_login_weas from '../../assets/undraw_login_weas.svg';
import {login} from '../../../services/servicesApi'; // Adjust the import path as necessary
import { sha256 } from 'js-sha256'; // Ensure you have this library installed
import { useNavigate } from 'react-router-dom';


const Login = () => {
    const [formData, setFormData] = useState({
        user_id: '',
        password_hash: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.user_id || !formData.password_hash) {
            setError('Both fields are required!');
            return;
        }
        console.log('Submitting:', {
            user_id: formData.user_id,
            password: formData.password_hash
        });
        setIsLoading(true);
        setError('');
        //sha256()
        try {
            // Hash password and call your existing authService
            const response = await login(
                formData.user_id,
                formData.password_hash // Matches your backend hash
            );
            console.log('Login response:', response); // Log the response for debugging
            localStorage.setItem('currentUser', JSON.stringify(response));

            navigate('/dashboard', {
                state: { response } // Pass the entire response
            });
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
            console.error('Login error:', err); // Log the error for debugging
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='container flex w-[70dvw] h-[80dvh] rounded-2xl shadow-dark'>

            <div className="left flex flex-col rounded-2xl rounded-tr-none rounded-br-none items-center w-[50%] h-[100%] rounded-r-2xl bg-dark">

                <div className='heading mt-20 mb-40 flex w-[30%] h-14 bg-dark-hover rounded-md justify-center items-center gap-[5%] '>
                    <Link to='/login' className='flex w-[45%] h-[80%] rounded-md bg-dark justify-center items-center'>Login</Link>
                    <Link to='/signup' className='flex w-[45%] h-[80%] rounded-md  justify-center items-center'>Sign-up</Link>
                </div>

                <form className="flex flex-col w-[80%] h-[90%] items-center gap-5" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <InputField
                        type="text"
                        placeholder="User ID"
                        width="70%"
                        height="45px"
                        bgColor="bg-dark-hover"
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleChange}
                    />

                    {/* Password Input */}
                    <InputField
                        type="password"
                        placeholder="Password"
                        width="70%"
                        height="45px"
                        bgColor="bg-dark-hover"
                        name="password_hash"
                        value={formData.password_hash}
                        onChange={handleChange}
                    />

                    

                    <Divider width='40%' />

                    <div className="logins flex justify-between items-center w-[70%]">
                        <Button width='w-full' height='h-12' text="Login" bgColor='bg-light' textColor='text-dark' type='submit'/>
                    </div>

                    {/* Display error message if fields are empty */}
                    {error && <div className="text-red-500 text-sm m-4">{error}</div>}
                </form>
            </div>

            <div className='right flex flex-col items-center justify-center h-[100%] w-[50%] rounded-2xl rounded-tl-none rounded-bl-none bg-dark-dark-card border-l-2 border-dark-hover p-8'>
                <img
                    src={undraw_login_weas}
                    alt="Illustration"
                    className="w-[50%] max-h-[60%] object-contain mb-6 filter grayscale-[50%] contrast-110"
                />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent tracking-tight">
                    Welcome Back.
                </h2>
                <p className="mt-2 text-gray-400 text-sm font-light">
                    Sign in to continue your learning journey
                </p>
            </div>
        </div>
    );
}

export default Login;
