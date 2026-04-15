using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;
using Clipper2Lib;
using Path = System.Windows.Shapes.Path;

namespace ElectronicWhiteboard.Services
{
    /// <summary>
    /// 布尔运算类型
    /// </summary>
    public enum BooleanOperationType
    {
        Union,           // 并集
        Intersection,    // 交集
        Difference,      // 差集
        Xor              // 对称差集（分割）
    }

    /// <summary>
    /// 布尔运算服务 - 使用 Clipper2 库
    /// </summary>
    public class BooleanOperationService
    {
        /// <summary>
        /// 执行布尔运算
        /// </summary>
        /// <param name="paths">输入路径列表</param>
        /// <param name="operation">运算类型</param>
        /// <returns>运算结果路径</returns>
        public static List<List<Point>> Execute(List<List<Point>> paths, BooleanOperationType operation)
        {
            if (paths == null || paths.Count < 2)
                return new List<List<Point>>();

            // 转换为 Clipper2 格式
            var clipperPaths = new List<Path64>();
            foreach (var path in paths)
            {
                var clipperPath = new Path64();
                foreach (var point in path)
                {
                    // 放大坐标以提高精度
                    clipperPath.Add(new Point64((long)(point.X * 1000), (long)(point.Y * 1000)));
                }
                if (clipperPath.Count > 0)
                    clipperPaths.Add(clipperPath);
            }

            if (clipperPaths.Count < 2)
                return new List<List<Point>>();

            // 执行布尔运算
            var result = new Paths64();
            var clipper = new Clipper64();

            // 添加路径到剪裁器
            clipper.AddSubject(clipperPaths[0]);
            clipper.AddClip(clipperPaths[1]);

            var fillRule = Clipper2Lib.FillRule.NonZero;
            
            switch (operation)
            {
                case BooleanOperationType.Union:
                    clipper.Execute(ClipType.Union, fillRule, result);
                    break;
                case BooleanOperationType.Intersection:
                    clipper.Execute(ClipType.Intersection, fillRule, result);
                    break;
                case BooleanOperationType.Difference:
                    clipper.Execute(ClipType.Difference, fillRule, result);
                    break;
                case BooleanOperationType.Xor:
                    clipper.Execute(ClipType.Xor, fillRule, result);
                    break;
            }

            // 转换回 WPF 坐标
            var resultPaths = new List<List<Point>>();
            foreach (var path in result)
            {
                var wpfPath = new List<Point>();
                foreach (var point in path)
                {
                    wpfPath.Add(new Point(point.X / 1000.0, point.Y / 1000.0));
                }
                if (wpfPath.Count > 2) // 至少需要3个点构成多边形
                    resultPaths.Add(wpfPath);
            }

            return resultPaths;
        }

        /// <summary>
        /// 将 WPF Path 转换为点列表
        /// </summary>
        public static List<Point> PathToPoints(Path path)
        {
            var points = new List<Point>();

            if (path.Data is PathGeometry geometry)
            {
                foreach (var figure in geometry.Figures)
                {
                    points.Add(figure.StartPoint);
                    foreach (var segment in figure.Segments)
                    {
                        if (segment is LineSegment lineSeg)
                        {
                            points.Add(lineSeg.Point);
                        }
                        else if (segment is PolyLineSegment polySeg)
                        {
                            foreach (var pt in polySeg.Points)
                            {
                                points.Add(pt);
                            }
                        }
                    }
                }
            }

            return points;
        }

        /// <summary>
        /// 从矩形获取点列表
        /// </summary>
        public static List<Point> RectangleToPoints(double x, double y, double width, double height)
        {
            return new List<Point>
            {
                new Point(x, y),
                new Point(x + width, y),
                new Point(x + width, y + height),
                new Point(x, y + height)
            };
        }

        /// <summary>
        /// 从椭圆获取点列表（近似多边形）
        /// </summary>
        public static List<Point> EllipseToPoints(double x, double y, double width, double height, int segments = 36)
        {
            var points = new List<Point>();
            double centerX = x + width / 2;
            double centerY = y + height / 2;
            double radiusX = width / 2;
            double radiusY = height / 2;

            for (int i = 0; i < segments; i++)
            {
                double angle = 2 * Math.PI * i / segments;
                points.Add(new Point(
                    centerX + radiusX * Math.Cos(angle),
                    centerY + radiusY * Math.Sin(angle)
                ));
            }

            return points;
        }

        /// <summary>
        /// 将点列表转换为 WPF PathGeometry
        /// </summary>
        public static PathGeometry PointsToGeometry(List<Point> points, bool isClosed = true)
        {
            if (points == null || points.Count < 2)
                return new PathGeometry();

            var geometry = new PathGeometry();
            var figure = new PathFigure
            {
                StartPoint = points[0],
                IsClosed = isClosed
            };

            for (int i = 1; i < points.Count; i++)
            {
                figure.Segments.Add(new LineSegment(points[i], true));
            }

            // 如果是闭合的且起点不等于终点，添加回到起点的线段
            if (isClosed && points.Count > 2 && points[points.Count - 1] != points[0])
            {
                figure.Segments.Add(new LineSegment(points[0], true));
            }

            geometry.Figures.Add(figure);
            return geometry;
        }
    }
}