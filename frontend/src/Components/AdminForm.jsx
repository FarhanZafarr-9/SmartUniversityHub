
import InputField from './InputFeild'; // Make sure InputField is imported correctly

const AdminForm = ({userData, handleInputChange}) => {

    return (
        <>
            <InputField
                type="text"
                id="adminKey"
                name="department"
                value={userData.adminKey}
                onChange={handleInputChange}
                required
                placeholder="Admin Key"
                width="45%" // Customize width as needed
                height="h-12"  // Customize height as needed
                bgColor="bg-dark-hover"  // Customize background color if needed
            />

            <InputField
                type="password"
                id="adminPassword"
                name="passweord"
                value={userData.adminPassword}
                onChange={handleInputChange}
                required
                placeholder="Password"
                width="45%" // Customize width as needed
                height="h-12"  // Customize height as needed
                bgColor="bg-dark-hover"  // Customize background color if needed
            />
        </>
    );
};

export default AdminForm;