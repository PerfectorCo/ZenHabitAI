
export type Language = 'en' | 'vi';

export const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      habits: 'Habits & Tasks',
      focus: 'Focus Timer',
      analytics: 'Analytics',
      profile: 'Profile',
      feedback: 'Feedback'
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
      ok: 'OK',
      submit: 'Submit'
    },
    pricing: {
      page: {
        title: 'Choose the rhythm that fits you',
        subtitle: 'ZenHabit AI doesn’t push you to be perfect. It simply helps you understand yourself, one day at a time.'
      },
      plans: {
        free: {
          name: 'Free',
          tagline: 'Start the path',
          description: 'For those beginning to build discipline and exploring a more intentional rhythm of living.',
          features: [
            'Unlimited habits & tasks',
            'Full Pomodoro focus timer',
            'Basic analytics & streak tracking',
            'Device sync',
            '3 AI habit suggestions each day',
            'Weekly Zen Sensei insight'
          ],
          cta: 'Continue with Free'
        },
        pro: {
          name: 'Pro',
          tagline: 'Clarity & Consistency',
          price: '3.99 USD / month',
          description: 'For when you want to go deeper — not just to do, but to understand why you’re doing it.',
          features: [
            'Unlimited context-aware AI habit guidance',
            'Daily, weekly, and monthly Zen Sensei insights',
            'Deeper analysis of habit strength and deep work',
            'Long-term history and perspective',
            'Calm, non-judgmental AI experience'
          ],
          cta: 'Go deeper with Pro'
        },
        master: {
          name: 'Zen Master',
          tagline: 'Live with intention',
          status: 'Coming soon',
          description: 'For those who wish to turn discipline into a way of living.',
          features: [
            'AI insights by focus area',
            'Deeper, coaching-style reflections',
            'Data export & reflective journaling',
            'Early access to new experiences'
          ],
          cta: 'Sowing the seeds'
        }
      },
      closing: {
        title: 'You are never forced to pay',
        message: 'ZenHabit AI stays with you, no matter which rhythm you choose. When you’re ready to go deeper, Pro will be there.'
      }
    },
    feedback: {
      header: 'Send Feedback',
      subtitle: 'Your suggestions help us build a better ZenHabit AI.',
      typeLabel: 'Feedback Type',
      types: {
        bug: 'Report a Bug',
        suggestion: 'New Feature Suggestion',
        other: 'General Feedback'
      },
      messageLabel: 'Your Message',
      messagePlh: 'Tell us what you are thinking...',
      success: 'Thank you. Your feedback has been received.',
      error: 'Something went wrong. Please try again later.'
    },
    auth: {
      welcome: 'ZenHabit AI',
      subtitle: 'Your journey to mindfulness and productivity starts here. Sign in to sync your habits.',
      google: 'Continue with Google',
      facebook: 'Continue with Facebook',
      terms: 'By continuing, you agree to our Terms of Service'
    },
    onboarding: {
      customGoal: 'Add your own goal...',
      customGoalPlh: 'e.g. Mastering Digital Art',
      customGoalAdd: 'Set custom goal'
    },
    dashboard: {
      welcome: 'What rhythm are you in today?',
      focusForToday: 'Your focus for today',
      progress: "Today's Progress",
      progressSub: "Keep going. You are moving toward your daily goal.",
      longestStreak: 'Longest Streak',
      totalActions: 'Total Actions',
      aiRecs: 'A gentle suggestion',
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
      postponed: 'Paused for today',
      done: 'Completed',
      editTask: 'Edit Task',
      saveTemplate: 'Save as template',
      skip: 'Paused for today'
    },
    pomodoro: {
      completeTitle: 'This focus session has ended',
      completeSub: 'Amazing work on',
      markDone: 'Mark Goal as Done',
      break: 'Break',
      goalUpdated: 'Goal Updated.',
      selectGoal: 'Select a goal first.',
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
        reading: 'Reading',
        learning: 'Learning',
        meditation: 'Meditation',
        exercise: 'Exercise'
      }
    },
    analytics: {
      header: 'Growth & Productivity',
      subtitle: 'Overview of habits, tasks, and focus sessions.',
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
      customGoal: 'Custom Goal',
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
      profile: 'Cá nhân',
      feedback: 'Góp ý'
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
      ok: 'Đồng ý',
      submit: 'Gửi góp ý'
    },
    pricing: {
      page: {
        title: 'Chọn nhịp đi phù hợp với bạn',
        subtitle: 'ZenHabit AI không ép bạn phải hoàn hảo. Chỉ giúp bạn hiểu mình rõ hơn, từng ngày.'
      },
      plans: {
        free: {
          name: 'Free',
          tagline: 'Bắt đầu hành trình',
          description: 'Dành cho những ai đang bắt đầu xây dựng kỷ luật và muốn làm quen với nhịp sống có chủ đích.',
          features: [
            'Không giới hạn Habits & Tasks',
            'Pomodoro Focus Timer đầy đủ',
            'Thống kê cơ bản & chuỗi ngày (streaks)',
            'Đồng bộ thiết bị',
            'AI gợi ý 3 thói quen mỗi ngày',
            'Zen Sensei Insight hàng tuần'
          ],
          cta: 'Tiếp tục với Free'
        },
        pro: {
          name: 'Pro',
          tagline: 'Rõ ràng và nhất quán',
          price: '79.000 VNĐ / tháng',
          description: 'Khi bạn muốn đi sâu hơn, không chỉ “làm”, mà còn hiểu vì sao mình đang làm.',
          features: [
            'AI gợi ý thói quen không giới hạn, dựa trên bối cảnh cá nhân',
            'Zen Sensei Insight mỗi ngày, mỗi tuần và mỗi tháng',
            'Phân tích sâu về Habit Strength và Deep Work',
            'Lịch sử và góc nhìn dài hạn',
            'Trải nghiệm AI nhẹ nhàng, không phán xét'
          ],
          cta: 'Đi sâu hơn với Pro'
        },
        master: {
          name: 'Zen Master',
          tagline: 'Sống có chủ đích',
          status: 'Sắp ra mắt',
          description: 'Dành cho những người muốn biến kỷ luật thành một triết lý sống.',
          features: [
            'AI Insight theo từng Focus Area',
            'Reflection sâu hơn, mang tính coaching',
            'Xuất dữ liệu & nhật ký chiêm nghiệm',
            'Trải nghiệm tính năng mới sớm nhất'
          ],
          cta: 'Đang gieo mầm'
        }
      },
      closing: {
        title: 'Bạn không bị ép phải trả tiền',
        message: 'ZenHabit AI vẫn ở đây để đồng hành cùng bạn, dù bạn chọn nhịp đi nào. Khi bạn sẵn sàng đi sâu hơn, Pro sẽ chờ bạn ở đó.'
      }
    },
    feedback: {
      header: 'Gửi Góp Ý',
      subtitle: 'Những đề xuất của bạn giúp chúng tôi hoàn thiện ZenHabit AI tốt hơn.',
      typeLabel: 'Loại góp ý',
      types: {
        bug: 'Báo lỗi (Bug)',
        suggestion: 'Đề xuất chức năng mới',
        other: 'Ý kiến khác'
      },
      messageLabel: 'Nội dung',
      messagePlh: 'Hãy chia sẻ suy nghĩ của bạn tại đây...',
      success: 'Cảm ơn bạn. Góp ý của bạn đã được ghi nhận.',
      error: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    },
    auth: {
      welcome: 'ZenHabit AI',
      subtitle: 'Hành trình của bạn bắt đầu từ đây. Đăng nhập để đồng bộ dữ liệu.',
      google: 'Tiếp tục với Google',
      facebook: 'Tiếp tục với Facebook',
      terms: 'Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ của chúng tôi'
    },
    onboarding: {
      customGoal: 'Thêm mục tiêu riêng...',
      customGoalPlh: 'vd: Học hội họa kỹ thuật số',
      customGoalAdd: 'Sử dụng mục tiêu này'
    },
    dashboard: {
      welcome: 'Hôm nay, bạn đang ở nhịp nào?',
      focusForToday: 'Mục tiêu hôm nay',
      progress: 'Tiến độ hôm nay',
      progressSub: 'Hãy tiếp tục. Bạn đang tiến dần tới mục tiêu.',
      longestStreak: 'Chuỗi dài nhất',
      totalActions: 'Tổng hoạt động',
      aiRecs: 'Một gợi ý nhỏ cho bạn',
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
      postponed: 'Bỏ qua hôm nay',
      done: 'Đã hoàn thành',
      editTask: 'Sửa công việc',
      saveTemplate: 'Lưu thành mẫu',
      skip: 'Bỏ qua hôm nay'
    },
    pomodoro: {
      completeTitle: 'Khoảng tập trung đã khép lại',
      completeSub: 'Làm việc tuyệt vời cho',
      markDone: 'Đánh dấu hoàn thành',
      break: 'Nghỉ giải lao',
      goalUpdated: 'Đã cập nhật mục tiêu.',
      selectGoal: 'Vui lòng chọn mục tiêu trước.',
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
        reading: 'Đọc sách',
        learning: 'Học tập',
        meditation: 'Thiền định',
        exercise: 'Tập thể dục'
      }
    },
    analytics: {
      header: 'Tăng trưởng & Năng suất',
      subtitle: 'Tổng quan về thói quen, công việc và các phiên tập trung.',
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
      subtitle: 'Quản lý thông tin cá nhân và cài đặt mục tiêu.',
      signOut: 'Đăng xuất',
      fullName: 'Họ và tên',
      email: 'Địa chỉ Email',
      focusArea: 'Trọng tâm thói quen',
      bio: 'Tiểu sử ngắn',
      bioPlh: 'Giới thiệu đôi chút về bản thân bạn...',
      permissions: 'Quyền hệ thống',
      notifications: 'Thông báo trình duyệt',
      enableNow: 'Bật ngay',
      customGoal: 'Mục tiêu tự chọn',
      goals: {
        prod: 'Nâng cao năng suất',
        fitness: 'Thể chất khỏe mạnh',
        mental: 'Sức khỏe tinh thần',
        learning: 'Học kỹ năng mới'
      }
    }
  }
};
