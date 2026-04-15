#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Trae CN - AI IDE 工具脚本"""

import argparse
import os
import subprocess
import sys

class TraeCN:
    """Trae CN AI IDE 管理器"""
    
    def __init__(self):
        """初始化"""
        self.home = os.path.expanduser("~")
    
    def launch(self):
        """启动 Trae IDE"""
        print("🚀 启动 Trae IDE...")
        
        # 尝试通过命令行启动 (Windows)
        try:
            # 查找 Trae 安装路径
            trae_paths = [
                os.path.join(self.home, "AppData", "Local", "Programs", "Trae", "Trae.exe"),
                "C:\\Users\\Administrator\\AppData\\Local\\Programs\\Trae\\Trae.exe",
                "C:\\Program Files\\Trae\\Trae.exe",
            ]
            
            for path in trae_paths:
                if os.path.exists(path):
                    print(f"✅ 找到 Trae: {path}")
                    subprocess.Popen([path])
                    print("✅ Trae 已启动!")
                    return True
            
            # 如果没找到，尝试使用 start 命令
            subprocess.Popen(["cmd", "/c", "start", "Trae"])
            print("✅ 尝试启动 Trae!")
            return True
            
        except Exception as e:
            print(f"❌ 启动失败: {e}")
            
        print("❌ 未找到 Trae，请先安装 Trae CN")
        return False
    
    def create_project(self, name: str, template: str = "python"):
        """创建新项目"""
        print(f"📁 创建项目: {name}")
        
        project_dir = os.path.join(os.getcwd(), name)
        if os.path.exists(project_dir):
            print(f"❌ 项目已存在: {project_dir}")
            return False
        
        os.makedirs(project_dir)
        
        readme = os.path.join(project_dir, "README.md")
        with open(readme, "w", encoding="utf-8") as f:
            f.write(f"# {name}\n\n创建时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        print(f"✅ 项目已创建: {project_dir}")
        return True
    
    def show_help(self):
        """显示帮助"""
        help_text = '''
🤖 Trae CN AI IDE 工具

使用方式: 
  python3 scripts/trae.py launch         # 启动 Trae
  python3 scripts/trae.py create --name xxx  # 创建项目
  
文档: https://www.trae.com.cn
        '''
        print(help_text)

def main():
    parser = argparse.ArgumentParser(description="Trae CN AI IDE 工具")
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    parser_launch = subparsers.add_parser("launch", help="启动 Trae IDE")
    parser_create = subparsers.add_parser("create", help="创建新项目")
    parser_create.add_argument("--name", required=True, help="项目名称")
    
    args = parser.parse_args()
    
    trae = TraeCN()
    
    if args.command == "launch":
        trae.launch()
    elif args.command == "create":
        trae.create_project(args.name)
    elif args.command is None:
        trae.show_help()
    else:
        print(f"❌ 未知命令: {args.command}")
        sys.exit(1)

if __name__ == "__main__":
    main()