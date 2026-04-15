using System;
using System.Windows;

namespace CozeScheduler;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        
        // 全局异常处理
        AppDomain.CurrentDomain.UnhandledException += (s, args) =>
        {
            var ex = args.ExceptionObject as Exception;
            MessageBox.Show($"程序发生未处理的异常：\n{ex?.Message}", "错误", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        };

        DispatcherUnhandledException += (s, args) =>
        {
            MessageBox.Show($"UI 发生异常：\n{args.Exception.Message}", "错误", 
                MessageBoxButton.OK, MessageBoxImage.Error);
            args.Handled = true;
        };
    }
}