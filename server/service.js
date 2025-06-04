const axios = require('axios');

const GOOGLE_CHAT_WEBHOOK = 'https://chat.googleapis.com/v1/spaces/AAQAIEyDCSs/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=0vMOCQfMNVicfKr21ExywZxAHCVF4ygdB9MPb9BaRsc';

// Send message to Google Chat
const sendMessage = async (message) => {
  try {
    const response = await axios.post(GOOGLE_CHAT_WEBHOOK, message);
    console.log('Message sent to Google Chat');
    return response.data;
  } catch (error) {
    console.error('Failed to send message to Google Chat:', error.response?.data || error.message);
    throw error;
  }
};

// Format task creation message
const notifyTaskCreated = async (task, project, assignee) => {
  const message = {
    text: '',
    cards: [
      {
        header: {
          title: '🆕 New Task Created',
          subtitle: project.name,
          imageUrl: 'https://www.gstatic.com/images/icons/material/system/2x/assignment_black_24dp.png'
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Task',
                  content: task.title,
                  contentMultiline: true,
                  bottomLabel: task.description || 'No description'
                }
              },
              {
                keyValue: {
                  topLabel: 'Assigned To',
                  content: assignee.email
                }
              },
              {
                keyValue: {
                  topLabel: 'Due Date',
                  content: new Date(task.deadline).toLocaleDateString()
                }
              },
              {
                keyValue: {
                  topLabel: 'Status',
                  content: task.status
                }
              }
            ]
          }
        ]
      }
    ]
  };
  
  return sendMessage(message);
};

// Format project assignment message
const notifyProjectAssignment = async (project, user) => {
  const message = {
    cards: [
      {
        header: {
          title: '👥 New Project Assignment',
          subtitle: project.name,
          imageUrl: 'https://www.gstatic.com/images/icons/material/system/2x/group_add_black_24dp.png'
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'User Added',
                  content: user.email
                }
              },
              {
                keyValue: {
                  topLabel: 'Project',
                  content: project.name,
                  bottomLabel: project.description || 'No description'
                }
              },
              {
                keyValue: {
                  topLabel: 'Deadline',
                  content: new Date(project.deadline).toLocaleDateString()
                }
              }
            ]
          }
        ]
      }
    ]
  };
  
  return sendMessage(message);
};

// Format project status change message
const notifyProjectStatusChange = async (project, oldStatus, newStatus) => {
  const message = {
    cards: [
      {
        header: {
          title: '🔄 Project Status Change',
          subtitle: project.name,
          imageUrl: 'https://www.gstatic.com/images/icons/material/system/2x/update_black_24dp.png'
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Status Change',
                  content: `${oldStatus} → ${newStatus}`,
                  icon: newStatus === 'completed' ? 'STAR' : 'BOOKMARK'
                }
              },
              {
                keyValue: {
                  topLabel: 'Project',
                  content: project.name,
                  bottomLabel: project.description || 'No description'
                }
              },
              {
                keyValue: {
                  topLabel: 'Updated By',
                  content: 'System' // You'll want to replace this with the actual user
                }
              }
            ]
          }
        ]
      }
    ]
  };
  
  return sendMessage(message);
};

module.exports = {
  notifyTaskCreated,
  notifyProjectAssignment,
  notifyProjectStatusChange
};