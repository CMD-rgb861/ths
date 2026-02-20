import { FaCheck, FaSpinner } from 'react-icons/fa'; // Example icons

const StatusIndicator = ({ status, isConformed, requesterId }) => {
    console.log('StatusIndicator Props:', { status, isConformed, requesterId });
  const user = JSON.parse(localStorage.getItem('user'));
  const isRequester = user?.id === requesterId;

  if (status === 'Ongoing' && isConformed === undefined) {
    // Don't show indicator if still waiting for confirmation
    return null; 
  }

  if (status === 'Ongoing') {
    if (isConformed) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          <FaCheck className="mr-1" />
          {isRequester ? 'Waiting for your confirmation' : 'Conformed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
        <FaSpinner className="mr-1 animate-spin" />
        {isRequester ? 'Waiting for your confirmation' : 'Waiting for confirmation'}
      </span>
    );
  }

  return null;
};


export default StatusIndicator;
