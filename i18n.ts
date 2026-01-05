
export type Language = 'en' | 'vi';

export const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      habits: 'Habits & Tasks',
      focus: 'Focus Timer',
      analytics: 'Analytics',
      profile: 'Profile'
    },
    common: {
      save: 'Save Changes',
      delete: 'Delete',
      cancel: 'Cancel',
      add: 'Add',
      loading: 'Syncing with Cloud Database...',
      proPlan: 'Pro Plan',
      everyDay: 'Every Day',
      days: 'Days',
      minutes: 'Minutes',
      status: 'Status',
      ok: 'OK'
    },
    auth: {
      welcome: 'ZenHabit AI',
      subtitle: 'Your personalized journey to mindfulness and productivity starts here. Sign in to sync your habits to the cloud.',
      google: 'Continue with Google',
      facebook: 'Continue with Facebook',
      terms: 'By continuing, you agree to our Terms of Service'
    },
    dashboard: {
      welcome: 'Welcome back',
      focusForToday: 'Your focus for today',
      progress: "Today's Progress",
      progressSub: "Keep it up! You're almost at your daily goal.",
      longestStreak: 'Longest Streak',
      totalActions: 'Total Actions',
      aiRecs: 'AI Recommendations',
      aiInsights: 'Habit Insights',
      addedToList: 'Added to list',
      addToList: 'Add to my list'
    },
    habits: {
      header: 'Structure Your Day',
      subtitle: 'Syncing goals and tasks across all your devices.',
      newHabit: 'New Habit Goal',
      description: 'Action Description',
      descriptionPlh: 'e.g. 20 pushups every morning',
      category: 'Category',
      reminder: 'Reminder',
      addHabit: 'Add Habit',
      streaks: 'Daily Streaks',
      tasks: 'Tasks & Chores',
      presets: 'Presets Library',
      quickAction: 'Quick action...',
      repeatOn: 'Repeat on:',
      postponed: 'Postponed for Today',
      done: 'Done & Dusted',
      editTask: 'Edit Task',
      saveTemplate: 'Save as template',
      skip: 'Skip for today'
    },
    pomodoro: {
      completeTitle: 'Session Complete!',
      completeSub: 'Amazing work on',
      markDone: 'Mark Goal as Done',
      break: 'Break',
      goalUpdated: 'Goal Updated!',
      selectGoal: 'Select a goal first!',
      config: 'Timer Configuration',
      showPresets: 'Show Presets',
      customTimes: 'Custom Times',
      focusTime: 'Focus Time',
      breakTime: 'Break Time',
      autoStart: 'Auto-start next break',
      autoStartSub: 'Instantly transitions when session ends',
      focusTarget: 'Focus Target',
      history: 'Session History',
      today: 'Today',
      noSessions: 'No sessions logged today yet.',
      presets: {
        reading: 'Reading 📖',
        learning: 'Learning 🧠',
        meditation: 'Meditation 🧘',
        exercise: 'Exercise 🏃'
      }
    },
    analytics: {
      header: 'Growth & Productivity',
      subtitle: 'Comprehensive overview of habits, tasks, and focus sessions.',
      zenInsights: 'Zen Sensei Insights',
      analyzeNew: 'Analyze New Data',
      totalCompletions: 'Total Completions',
      focusTime: 'Focus Time',
      activeTasks: 'Active Tasks',
      growthPeriod: 'Growth Period',
      heatwave: 'Activity Heatwave',
      performance: 'Current Tasks Performance',
      completionRate: 'Task Completion Rate',
      consistency: 'Consistency List',
      habitStrength: 'Habits Strength',
      focusDist: 'Focus Distribution'
    },
    profile: {
      header: 'User Profile',
      subtitle: 'Manage your personal information and goal settings.',
      signOut: 'Sign Out',
      fullName: 'Full Name',
      email: 'Email Address',
      focusArea: 'Main Habit Focus',
      bio: 'Short Bio',
      bioPlh: 'Tell us about yourself...',
      permissions: 'System Permissions',
      notifications: 'Browser Notifications',
      enableNow: 'Enable Now',
      goals: {
        prod: 'Improve productivity',
        fitness: 'Physical fitness',
        mental: 'Mental health',
        learning: 'Learning skills'
      }
    }
  },
  vi: {
    nav: {
      dashboard: 'Bảng điều khiển',
      habits: 'Thói quen & Công việc',
      focus: 'Hẹn giờ tập trung',
      analytics: 'Phân tích',
      profile: 'Cá nhân'
    },
    common: {
      save: 'Lưu thay đổi',
      delete: 'Xóa',
      cancel: 'Hủy',
      add: 'Thêm',
      loading: 'Đang đồng bộ với cơ sở dữ liệu...',
      proPlan: 'Gói Pro',
      everyDay: 'Mọi ngày',
      days: 'Ngày',
      minutes: 'Phút',
      status: 'Trạng thái',
      ok: 'Đồng ý'
    },
    auth: {
      welcome: 'ZenHabit AI',
      subtitle: 'Hành trình cá nhân hóa của bạn để đạt được sự tập trung và năng suất bắt đầu từ đây. Đăng nhập để đồng bộ dữ liệu.',
      google: 'Tiếp tục với Google',
      facebook: 'Tiếp tục với Facebook',
      terms: 'Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ của chúng tôi'
    },
    dashboard: {
      welcome: 'Chào mừng trở lại',
      focusForToday: 'Mục tiêu hôm nay',
      progress: 'Tiến độ hôm nay',
      progressSub: 'Làm tốt lắm! Bạn sắp đạt được mục tiêu hàng ngày.',
      longestStreak: 'Chuỗi dài nhất',
      totalActions: 'Tổng hoạt động',
      aiRecs: 'Gợi ý từ AI',
      aiInsights: 'Phân tích thói quen',
      addedToList: 'Đã thêm vào danh sách',
      addToList: 'Thêm vào danh sách'
    },
    habits: {
      header: 'Sắp xếp ngày của bạn',
      subtitle: 'Đồng bộ hóa mục tiêu và nhiệm vụ trên tất cả các thiết bị.',
      newHabit: 'Mục tiêu thói quen mới',
      description: 'Mô tả hành động',
      descriptionPlh: 'vd: 20 cái chống đẩy mỗi sáng',
      category: 'Danh mục',
      reminder: 'Nhắc nhở',
      addHabit: 'Thêm thói quen',
      streaks: 'Chuỗi thói quen hàng ngày',
      tasks: 'Công việc & Nhiệm vụ',
      presets: 'Thư viện mẫu',
      quickAction: 'Thêm nhanh công việc...',
      repeatOn: 'Lặp lại vào:',
      postponed: 'Đã tạm hoãn hôm nay',
      done: 'Đã hoàn thành',
      editTask: 'Sửa công việc',
      saveTemplate: 'Lưu thành mẫu',
      skip: 'Bỏ qua hôm nay'
    },
    pomodoro: {
      completeTitle: 'Hoàn thành phiên!',
      completeSub: 'Làm việc tuyệt vời cho',
      markDone: 'Đánh dấu hoàn thành',
      break: 'Nghỉ giải lao',
      goalUpdated: 'Đã cập nhật mục tiêu!',
      selectGoal: 'Vui lòng chọn mục tiêu trước!',
      config: 'Cấu hình thời gian',
      showPresets: 'Hiện các mẫu',
      customTimes: 'Tùy chỉnh thời gian',
      focusTime: 'Thời gian tập trung',
      breakTime: 'Thời gian nghỉ',
      autoStart: 'Tự động nghỉ sau phiên',
      autoStartSub: 'Chuyển đổi ngay khi kết thúc phiên tập trung',
      focusTarget: 'Mục tiêu tập trung',
      history: 'Lịch sử phiên tập trung',
      today: 'Hôm nay',
      noSessions: 'Chưa có phiên nào được ghi lại hôm nay.',
      presets: {
        reading: 'Đọc sách 📖',
        learning: 'Học tập 🧠',
        meditation: 'Thiền định 🧘',
        exercise: 'Tập thể dục 🏃'
      }
    },
    analytics: {
      header: 'Tăng trưởng & Năng suất',
      subtitle: 'Tổng quan toàn diện về thói quen, công việc và các phiên tập trung.',
      zenInsights: 'Phân tích từ Zen Sensei',
      analyzeNew: 'Phân tích dữ liệu mới',
      totalCompletions: 'Tổng hoàn thành',
      focusTime: 'Thời gian tập trung',
      activeTasks: 'Công việc đang làm',
      growthPeriod: 'Giai đoạn tăng trưởng',
      heatwave: 'Biểu đồ hoạt động',
      performance: 'Hiệu suất công việc hiện tại',
      completionRate: 'Tỉ lệ hoàn thành công việc',
      consistency: 'Danh sách nhất quán',
      habitStrength: 'Sức mạnh thói quen',
      focusDist: 'Phân bổ tập trung'
    },
    profile: {
      header: 'Thông tin cá nhân',
      subtitle: 'Quản lý thông tin cá nhân và cài đặt mục tiêu của bạn.',
      signOut: 'Đăng xuất',
      fullName: 'Họ và tên',
      email: 'Địa chỉ Email',
      focusArea: 'Trọng tâm thói quen',
      bio: 'Tiểu sử ngắn',
      bioPlh: 'Giới thiệu đôi chút về bản thân bạn...',
      permissions: 'Quyền hệ thống',
      notifications: 'Thông báo trình duyệt',
      enableNow: 'Bật ngay',
      goals: {
        prod: 'Nâng cao năng suất',
        fitness: 'Thể chất khỏe mạnh',
        mental: 'Sức khỏe tinh thần',
        learning: 'Học kỹ năng mới'
      }
    }
  }
};
