import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

// Типы отображения данных
const DISPLAY_TYPES = {
  BARS: 'Столбцы',
  NUMBERS: 'Числовые значения',
  CIRCLE: 'Круговая диаграмма',
  HISTOGRAM: 'Гистограмма'
};

// Предустановленные наборы данных
const PRESET_DATA = {
  RANDOM: 'Случайные данные',
  SORTED: 'Отсортированные данные',
  REVERSE: 'Обратно отсортированные',
  NEARLY: 'Почти отсортированные',
  REPEATED: 'С повторениями'
};

const ALGORITHMS = {
  BUBBLE: 'Пузырьковая сортировка',
  SELECTION: 'Сортировка выбором',
  INSERTION: 'Сортировка вставками',
  MERGE: 'Сортировка слиянием',
  QUICK: 'Быстрая сортировка',
  HEAP: 'Пирамидальная сортировка',
  COUNTING: 'Сортировка подсчетом',
  BUCKET: 'Блочная сортировка',
  RADIX: 'Поразрядная сортировка',
  SHELL: 'Сортировка Шелла',
  TIM: 'Timsort'
};

const ALGORITHM_DESCRIPTIONS = {
  BUBBLE: 'Пузырьковая сортировка - простой алгоритм, который многократно проходит по списку, сравнивает соседние элементы и меняет их местами, если они в неправильном порядке. Сложность: O(n²).',
  SELECTION: 'Сортировка выбором находит наименьший элемент и помещает его в начало, затем находит следующий наименьший и т.д. Сложность: O(n²).',
  INSERTION: 'Сортировка вставками строит отсортированный массив по одному элементу за раз. Эффективна для небольших наборов данных. Сложность: O(n²).',
  MERGE: 'Сортировка слиянием - рекурсивный алгоритм "разделяй и властвуй", который делит массив пополам, сортирует половины и объединяет их. Сложность: O(n log n).',
  QUICK: 'Быстрая сортировка - высокопроизводительный рекурсивный алгоритм, который выбирает опорный элемент и разделяет массив на элементы меньше и больше опорного. Сложность: в среднем O(n log n), худший случай O(n²).',
  HEAP: 'Пирамидальная сортировка использует бинарную кучу для сортировки элементов. Стабильная производительность для любых входных данных. Сложность: O(n log n).',
  COUNTING: 'Сортировка подсчетом использует дополнительный массив для подсчета количества каждого элемента и затем восстанавливает отсортированный массив. Сложность: O(n+k), где k - диапазон значений.',
  BUCKET: 'Блочная сортировка распределяет элементы по "блокам" и сортирует каждый блок отдельно. Сложность: в среднем O(n+k), худший случай O(n²).',
  RADIX: 'Поразрядная сортировка сортирует числа по разрядам, от наименее значимого к наиболее значимому. Сложность: O(nk), где k - количество разрядов.',
  SHELL: 'Сортировка Шелла - улучшенная версия сортировки вставками, которая сначала сортирует элементы на определенном расстоянии друг от друга, затем уменьшает это расстояние. Сложность: зависит от последовательности промежутков, обычно O(n log² n).',
  TIM: 'Timsort - гибридный алгоритм, сочетающий сортировку вставками и слиянием. Он используется в Python и Java. Эффективен для реальных данных с частично упорядоченными подпоследовательностями. Сложность: O(n log n).'
};

// Основной компонент приложения
const SortingVisualizer = () => {
  // Состояния приложения
  const [array, setArray] = useState([]);
  const [arraySize, setArraySize] = useState(30);
  const [sortingSpeed, setSortingSpeed] = useState(50);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('BUBBLE');
  const [algorithmsToCompare, setAlgorithmsToCompare] = useState([]);
  const [isSorting, setIsSorting] = useState(false);
  const [isSorted, setIsSorted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStepMode, setIsStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCompare, setCurrentCompare] = useState([-1, -1]);
  const [currentSwap, setCurrentSwap] = useState([-1, -1]);
  const [displayType, setDisplayType] = useState('BARS');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('RANDOM');
  const [zoom, setZoom] = useState(100);
  const [stats, setStats] = useState({
    comparisons: 0,
    swaps: 0,
    time: 0
  });
  const [animationHistory, setAnimationHistory] = useState([]);
  const [compareResults, setCompareResults] = useState([]);
  const [fileData, setFileData] = useState(null);

  // Рефы для хранения таймаутов анимации
  const timeouts = useRef([]);
  const animationState = useRef({
    array: [],
    currentStep: 0,
    animations: []
  });

  // Генерация нового массива при изменении размера или пресета
  useEffect(() => {
    resetArray();
  }, [arraySize, selectedPreset]);

  // Применение темной темы
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Очистка таймаутов при размонтировании
  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Функция генерации нового массива
  const resetArray = () => {
    if (isSorting) return;
    
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current = [];
    
    let newArray = [];
    
    switch (selectedPreset) {
      case 'RANDOM':
        // Случайные данные
        for (let i = 0; i < arraySize; i++) {
          newArray.push(randomIntFromInterval(5, 80));
        }
        break;
      case 'SORTED':
        // Отсортированные данные
        for (let i = 0; i < arraySize; i++) {
          newArray.push(Math.floor(5 + (i * 75) / arraySize));
        }
        break;
      case 'REVERSE':
        // Обратно отсортированные данные
        for (let i = 0; i < arraySize; i++) {
          newArray.push(Math.floor(80 - (i * 75) / arraySize));
        }
        break;
      case 'NEARLY':
        // Почти отсортированные данные
        for (let i = 0; i < arraySize; i++) {
          newArray.push(Math.floor(5 + (i * 75) / arraySize));
        }
        // Вносим несколько перестановок
        for (let i = 0; i < arraySize * 0.1; i++) {
          const idx1 = randomIntFromInterval(0, arraySize - 1);
          const idx2 = randomIntFromInterval(0, arraySize - 1);
          [newArray[idx1], newArray[idx2]] = [newArray[idx2], newArray[idx1]];
        }
        break;
      case 'REPEATED':
        // Данные с повторениями
        const values = [10, 20, 30, 40, 50, 60, 70];
        for (let i = 0; i < arraySize; i++) {
          newArray.push(values[randomIntFromInterval(0, values.length - 1)]);
        }
        break;
      default:
        // По умолчанию случайные данные
        for (let i = 0; i < arraySize; i++) {
          newArray.push(randomIntFromInterval(5, 80));
        }
    }
    
    setArray(newArray);
    animationState.current.array = [...newArray];
    setCurrentCompare([-1, -1]);
    setCurrentSwap([-1, -1]);
    setIsSorted(false);
    setCurrentStep(0);
    setAnimationHistory([]);
    setStats({
      comparisons: 0,
      swaps: 0,
      time: 0
    });
  };

  // Функция генерации случайного числа
  const randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  // Обработчик изменения размера массива
  const handleSizeChange = (e) => {
    setArraySize(Number(e.target.value));
  };

  // Обработчик изменения скорости сортировки
  const handleSpeedChange = (e) => {
    setSortingSpeed(Number(e.target.value));
  };

  // Обработчик выбора алгоритма
  const handleAlgorithmChange = (e) => {
    setSelectedAlgorithm(e.target.value);
  };

  // Обработчик выбора пресета данных
  const handlePresetChange = (e) => {
    setSelectedPreset(e.target.value);
  };

  // Обработчик выбора типа отображения
  const handleDisplayTypeChange = (e) => {
    setDisplayType(e.target.value);
  };
  
  // Обработчик изменения масштаба
  const handleZoomChange = (e) => {
    setZoom(Number(e.target.value));
  };
  
  // Переключение темной/светлой темы
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // Обработчик ввода пользовательских данных
  const handleUserInputChange = (e) => {
    setUserInput(e.target.value);
  };
  
  // Применение пользовательского ввода
  const applyUserInput = () => {
    try {
      // Преобразовываем ввод в массив чисел
      const inputArray = userInput
        .split(/[,;\s]+/)
        .map(val => val.trim())
        .filter(val => val !== '')
        .map(val => parseInt(val, 10));
      
      // Проверяем корректность
      if (inputArray.length === 0 || inputArray.some(isNaN)) {
        alert('Пожалуйста, введите корректный массив чисел, разделенных запятыми или пробелами.');
        return;
      }
      
      // Нормализуем значения в диапазон 5-80
      const min = Math.min(...inputArray);
      const max = Math.max(...inputArray);
      const range = max - min;
      
      const normalizedArray = inputArray.map(val => {
        return range === 0 ? 40 : Math.floor(5 + (val - min) * 75 / range);
      });
      
      setArray(normalizedArray);
      setArraySize(normalizedArray.length);
      setCurrentCompare([-1, -1]);
      setCurrentSwap([-1, -1]);
      setIsSorted(false);
      setCurrentStep(0);
      setAnimationHistory([]);
      setStats({
        comparisons: 0,
        swaps: 0,
        time: 0
      });
    } catch (error) {
      alert('Произошла ошибка при обработке ввода: ' + error.message);
    }
  };
  
  // Обработчик загрузки файла
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let parsedData = [];
        
        if (file.name.endsWith('.json')) {
          // Обработка JSON файла
          parsedData = JSON.parse(content);
          if (Array.isArray(parsedData)) {
            setFileData(parsedData);
          } else if (parsedData.data && Array.isArray(parsedData.data)) {
            setFileData(parsedData.data);
          } else {
            alert('Неверный формат JSON. Ожидается массив чисел или объект с полем "data".');
            return;
          }
        } else if (file.name.endsWith('.csv')) {
          // Обработка CSV файла
          const result = Papa.parse(content, {
            header: false,
            dynamicTyping: true
          });
          
          if (result.data && result.data.length > 0) {
            // Берем первую строку данных
            parsedData = result.data[0].filter(val => typeof val === 'number' && !isNaN(val));
            
            // Если нет данных в первой строке, попробуем взять данные из первого столбца
            if (parsedData.length === 0 && result.data.length > 1) {
              parsedData = result.data.map(row => row[0]).filter(val => typeof val === 'number' && !isNaN(val));
            }
            
            setFileData(parsedData);
          } else {
            alert('Неверный формат CSV. Проверьте файл.');
            return;
          }
        } else {
          alert('Поддерживаются только файлы .json и .csv');
          return;
        }
        
        // Применяем данные из файла
        if (parsedData.length > 0) {
          // Нормализуем значения в диапазон 5-80
          const min = Math.min(...parsedData);
          const max = Math.max(...parsedData);
          const range = max - min;
          
          const normalizedArray = parsedData.map(val => {
            return range === 0 ? 40 : Math.floor(5 + (val - min) * 75 / range);
          });
          
          setArray(normalizedArray);
          setArraySize(normalizedArray.length);
          setCurrentCompare([-1, -1]);
          setCurrentSwap([-1, -1]);
          setIsSorted(false);
          setCurrentStep(0);
          setAnimationHistory([]);
          setStats({
            comparisons: 0,
            swaps: 0,
            time: 0
          });
        }
      } catch (error) {
        alert('Ошибка при обработке файла: ' + error.message);
      }
    };
    
    if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      alert('Поддерживаются только файлы .json и .csv');
    }
  };

  // Экспорт статистики в JSON
  const exportStatsToJSON = () => {
    const exportData = {
      algorithm: selectedAlgorithm,
      algorithmName: ALGORITHMS[selectedAlgorithm],
      arraySize: array.length,
      comparisons: stats.comparisons,
      swaps: stats.swaps,
      executionTime: stats.time,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sort-stats-${selectedAlgorithm}-${array.length}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Экспорт статистики в CSV
  const exportStatsToCSV = () => {
    const exportData = [
      ['Algorithm', 'Algorithm Name', 'Array Size', 'Comparisons', 'Swaps', 'Execution Time (s)', 'Timestamp'],
      [
        selectedAlgorithm,
        ALGORITHMS[selectedAlgorithm],
        array.length,
        stats.comparisons,
        stats.swaps,
        stats.time,
        new Date().toISOString()
      ]
    ];
    
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sort-stats-${selectedAlgorithm}-${array.length}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Включение/выключение пошагового режима
  const toggleStepMode = () => {
    if (isSorting) return;
    setIsStepMode(!isStepMode);
  };
  
  // Функция для выполнения одного шага вперед
  const stepForward = () => {
    if (currentStep >= animationHistory.length - 1) return;
    
    const nextStep = currentStep + 1;
    const animation = animationHistory[nextStep];
    
    if (animation.type === 'compare') {
      setCurrentCompare(animation.indices);
      setStats(prevStats => ({
        ...prevStats,
        comparisons: prevStats.comparisons + 1
      }));
    } else if (animation.type === 'swap') {
      setCurrentSwap(animation.indices);
      setStats(prevStats => ({
        ...prevStats,
        swaps: prevStats.swaps + 1
      }));
      
      // Обновление массива после перестановки
      setArray(prevArray => {
        const newArray = [...prevArray];
        const [i, j] = animation.indices;
        const temp = newArray[i];
        newArray[i] = newArray[j];
        newArray[j] = temp;
        return newArray;
      });
    } else if (animation.type === 'replace') {
      // Обновление массива при замене значения (для сортировки слиянием)
      setArray(prevArray => {
        const newArray = [...prevArray];
        newArray[animation.index] = animation.value;
        return newArray;
      });
    }
    
    setCurrentStep(nextStep);
    
    // Если это последний шаг, завершаем сортировку
    if (nextStep === animationHistory.length - 1) {
      setCurrentCompare([-1, -1]);
      setCurrentSwap([-1, -1]);
      setIsSorted(true);
    }
  };
  
  // Функция для выполнения одного шага назад
  const stepBackward = () => {
    if (currentStep <= 0) return;
    
    // Восстанавливаем состояние до текущего шага
    setArray([...animationState.current.array]);
    setCurrentCompare([-1, -1]);
    setCurrentSwap([-1, -1]);
    setCurrentStep(0);
    setStats({
      comparisons: 0,
      swaps: 0,
      time: 0
    });
    
    // Применяем все шаги до предыдущего
    for (let i = 0; i < currentStep - 1; i++) {
      const animation = animationHistory[i];
      
      if (animation.type === 'compare') {
        setStats(prevStats => ({
          ...prevStats,
          comparisons: prevStats.comparisons + 1
        }));
      } else if (animation.type === 'swap') {
        setStats(prevStats => ({
          ...prevStats,
          swaps: prevStats.swaps + 1
        }));
        
        // Обновление массива после перестановки
        setArray(prevArray => {
          const newArray = [...prevArray];
          const [i, j] = animation.indices;
          const temp = newArray[i];
          newArray[i] = newArray[j];
          newArray[j] = temp;
          return newArray;
        });
      } else if (animation.type === 'replace') {
        // Обновление массива при замене значения (для сортировки слиянием)
        setArray(prevArray => {
          const newArray = [...prevArray];
          newArray[animation.index] = animation.value;
          return newArray;
        });
      }
    }
    
    setCurrentStep(currentStep - 1);
    
    // Показываем текущую операцию для предыдущего шага
    const prevAnimation = animationHistory[currentStep - 1];
    if (prevAnimation.type === 'compare') {
      setCurrentCompare(prevAnimation.indices);
    } else if (prevAnimation.type === 'swap') {
      setCurrentSwap(prevAnimation.indices);
    }
    
    setIsSorted(false);
  };

  // Запуск сортировки
  const startSorting = () => {
    if (isSorting || isSorted) return;
    
    setIsSorting(!isStepMode);
    setIsPaused(false);
    setStats({
      comparisons: 0,
      swaps: 0,
      time: 0
    });
    
    // Копируем исходный массив для пошагового режима
    animationState.current.array = [...array];
    
    const startTime = performance.now();
    
    // Выбор алгоритма сортировки
    switch (selectedAlgorithm) {
      case 'BUBBLE':
        bubbleSort();
        break;
      case 'SELECTION':
        selectionSort();
        break;
      case 'INSERTION':
        insertionSort();
        break;
      case 'MERGE':
        mergeSort();
        break;
      case 'QUICK':
        quickSort();
        break;
      case 'HEAP':
        heapSort();
        break;
      case 'COUNTING':
        countingSort();
        break;
      case 'BUCKET':
        bucketSort();
        break;
      case 'RADIX':
        radixSort();
        break;
      case 'SHELL':
        shellSort();
        break;
      case 'TIM':
        timSort();
        break;
      default:
        bubbleSort();
    }
    
    // В пошаговом режиме не устанавливаем таймер для времени
    if (!isStepMode) {
      // Установка статистики времени после завершения
      const timerId = setTimeout(() => {
        const endTime = performance.now();
        setStats(prevStats => ({
          ...prevStats,
          time: ((endTime - startTime) / 1000).toFixed(2)
        }));
      }, timeouts.current.length * (101 - sortingSpeed));
      
      timeouts.current.push(timerId);
    }
  };
  
  // Прерывание сортировки
  const pauseSorting = () => {
    if (!isSorting || isSorted) return;
    
    setIsPaused(true);
    setIsSorting(false);
    
    // Очистка всех оставшихся таймаутов
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current = [];
    
    // Обновляем время выполнения на момент остановки
    const endTime = performance.now();
    setStats(prevStats => ({
      ...prevStats,
      time: ((endTime - performance.now() + prevStats.time * 1000) / 1000).toFixed(2)
    }));
  };
  
  // Запуск сравнения алгоритмов
  const startComparing = () => {
    if (isSorting || algorithmsToCompare.length === 0) return;
    
    setCompareResults([]);
    const results = [];
    const originalArray = [...array];
    
    // Для каждого выбранного алгоритма запускаем сортировку и собираем статистику
    algorithmsToCompare.forEach(algorithm => {
      const arrayCopy = [...originalArray];
      const startTime = performance.now();
      let comparisonStats = {
        comparisons: 0,
        swaps: 0
      };
      
      switch (algorithm) {
        case 'BUBBLE':
          bubbleSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'SELECTION':
          selectionSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'INSERTION':
          insertionSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'MERGE':
          mergeSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'QUICK':
          quickSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'HEAP':
          heapSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'COUNTING':
          countingSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'BUCKET':
          bucketSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'RADIX':
          radixSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'SHELL':
          shellSortForCompare(arrayCopy, comparisonStats);
          break;
        case 'TIM':
          timSortForCompare(arrayCopy, comparisonStats);
          break;
      }
      
      const endTime = performance.now();
      const executionTime = ((endTime - startTime) / 1000).toFixed(6);
      
      results.push({
        algorithm,
        algorithmName: ALGORITHMS[algorithm],
        comparisons: comparisonStats.comparisons,
        swaps: comparisonStats.swaps,
        executionTime
      });
    });
    
    // Сортируем результаты по времени выполнения
    results.sort((a, b) => parseFloat(a.executionTime) - parseFloat(b.executionTime));
    setCompareResults(results);
  };

  // Функция для добавления статистики сравнений
  const addComparison = () => {
    setStats(prevStats => ({
      ...prevStats,
      comparisons: prevStats.comparisons + 1
    }));
  };

  // Функция для добавления статистики перестановок
  const addSwap = () => {
    setStats(prevStats => ({
      ...prevStats,
      swaps: prevStats.swaps + 1
    }));
  };

  // Обработчик выбора алгоритма для сравнения
  const handleCompareAlgorithmChange = (e) => {
    const algorithm = e.target.value;
    if (e.target.checked) {
      setAlgorithmsToCompare([...algorithmsToCompare, algorithm]);
    } else {
      setAlgorithmsToCompare(algorithmsToCompare.filter(a => a !== algorithm));
    }
  };

  // ===== АЛГОРИТМЫ СОРТИРОВКИ =====

  // ПУЗЫРЬКОВАЯ СОРТИРОВКА
  const bubbleSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Сравнение элементов
        animations.push({
          type: 'compare',
          indices: [j, j + 1]
        });
        
        if (arrayCopy[j] > arrayCopy[j + 1]) {
          // Перестановка элементов
          animations.push({
            type: 'swap',
            indices: [j, j + 1]
          });
          
          const temp = arrayCopy[j];
          arrayCopy[j] = arrayCopy[j + 1];
          arrayCopy[j + 1] = temp;
        }
      }
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };

  // СОРТИРОВКА ВЫБОРОМ
  const selectionSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      
      for (let j = i + 1; j < n; j++) {
        // Сравнение элементов
        animations.push({
          type: 'compare',
          indices: [minIdx, j]
        });
        
        if (arrayCopy[j] < arrayCopy[minIdx]) {
          minIdx = j;
        }
      }
      
      // Если минимальный элемент не текущий, меняем их местами
      if (minIdx !== i) {
        animations.push({
          type: 'swap',
          indices: [i, minIdx]
        });
        
        const temp = arrayCopy[i];
        arrayCopy[i] = arrayCopy[minIdx];
        arrayCopy[minIdx] = temp;
      }
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };

  // СОРТИРОВКА ВСТАВКАМИ
  const insertionSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    for (let i = 1; i < n; i++) {
      const key = arrayCopy[i];
      let j = i - 1;
      
      while (j >= 0) {
        // Сравнение элементов
        animations.push({
          type: 'compare',
          indices: [j, j + 1]
        });
        
        if (arrayCopy[j] > key) {
          animations.push({
            type: 'swap',
            indices: [j, j + 1]
          });
          
          arrayCopy[j + 1] = arrayCopy[j];
          j--;
        } else {
          break;
        }
      }
      
      arrayCopy[j + 1] = key;
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };

  // СОРТИРОВКА СЛИЯНИЕМ
  const mergeSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    
    // Вспомогательная функция для рекурсивной сортировки
    const mergeSortHelper = (arr, start, end) => {
      if (start >= end) return;
      
      const mid = Math.floor((start + end) / 2);
      mergeSortHelper(arr, start, mid);
      mergeSortHelper(arr, mid + 1, end);
      merge(arr, start, mid, end);
    };
    
    // Функция слияния двух отсортированных подмассивов
    const merge = (arr, start, mid, end) => {
      const left = arr.slice(start, mid + 1);
      const right = arr.slice(mid + 1, end + 1);
      
      let i = 0, j = 0, k = start;
      
      while (i < left.length && j < right.length) {
        // Сравнение элементов
        animations.push({
          type: 'compare',
          indices: [start + i, mid + 1 + j]
        });
        
        if (left[i] <= right[j]) {
          animations.push({
            type: 'replace',
            index: k,
            value: left[i]
          });
          arr[k++] = left[i++];
        } else {
          animations.push({
            type: 'replace',
            index: k,
            value: right[j]
          });
          arr[k++] = right[j++];
        }
      }
      
      // Оставшиеся элементы left
      while (i < left.length) {
        animations.push({
          type: 'replace',
          index: k,
          value: left[i]
        });
        arr[k++] = left[i++];
      }
      
      // Оставшиеся элементы right
      while (j < right.length) {
        animations.push({
          type: 'replace',
          index: k,
          value: right[j]
        });
        arr[k++] = right[j++];
      }
    };
    
    // Запуск сортировки слиянием
    mergeSortHelper(arrayCopy, 0, arrayCopy.length - 1);
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };

  // БЫСТРАЯ СОРТИРОВКА
  const quickSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    
    // Вспомогательная функция для рекурсивной сортировки
    const quickSortHelper = (arr, low, high) => {
      if (low < high) {
        const pivotIndex = partition(arr, low, high);
        quickSortHelper(arr, low, pivotIndex - 1);
        quickSortHelper(arr, pivotIndex + 1, high);
      }
    };
    
    // Функция разделения массива
    const partition = (arr, low, high) => {
      const pivot = arr[high];
      let i = low - 1;
      
      for (let j = low; j < high; j++) {
        // Сравнение с опорным элементом
        animations.push({
          type: 'compare',
          indices: [j, high]
        });
        
        if (arr[j] < pivot) {
          i++;
          
          // Перестановка элементов
          animations.push({
            type: 'swap',
            indices: [i, j]
          });
          
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
        }
      }
      
      // Перестановка опорного элемента
      animations.push({
        type: 'swap',
        indices: [i + 1, high]
      });
      
      const temp = arr[i + 1];
      arr[i + 1] = arr[high];
      arr[high] = temp;
      
      return i + 1;
    };
    
    // Запуск быстрой сортировки
    quickSortHelper(arrayCopy, 0, arrayCopy.length - 1);
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };

  // ПИРАМИДАЛЬНАЯ СОРТИРОВКА
  const heapSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    // Построение максимальной кучи
    const buildMaxHeap = () => {
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(i, n);
      }
    };
    
    // Функция поддержки свойств кучи
    const heapify = (i, heapSize) => {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let largest = i;
      
      if (left < heapSize) {
        animations.push({
          type: 'compare',
          indices: [left, largest]
        });
        
        if (arrayCopy[left] > arrayCopy[largest]) {
          largest = left;
        }
      }
      
      if (right < heapSize) {
        animations.push({
          type: 'compare',
          indices: [right, largest]
        });
        
        if (arrayCopy[right] > arrayCopy[largest]) {
          largest = right;
        }
      }
      
      if (largest !== i) {
        animations.push({
          type: 'swap',
          indices: [i, largest]
        });
        
        const temp = arrayCopy[i];
        arrayCopy[i] = arrayCopy[largest];
        arrayCopy[largest] = temp;
        
        heapify(largest, heapSize);
      }
    };
    
    // Запуск пирамидальной сортировки
    buildMaxHeap();
    
    for (let i = n - 1; i > 0; i--) {
      animations.push({
        type: 'swap',
        indices: [0, i]
      });
      
      const temp = arrayCopy[0];
      arrayCopy[0] = arrayCopy[i];
      arrayCopy[i] = temp;
      
      heapify(0, i);
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };

  // СОРТИРОВКА ПОДСЧЕТОМ
  const countingSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    // Находим максимальное и минимальное значение
    let min = arrayCopy[0];
    let max = arrayCopy[0];
    
    for (let i = 1; i < n; i++) {
      animations.push({
        type: 'compare',
        indices: [0, i]
      });
      
      if (arrayCopy[i] < min) min = arrayCopy[i];
      if (arrayCopy[i] > max) max = arrayCopy[i];
    }
    
    const range = max - min + 1;
    const count = Array(range).fill(0);
    const output = Array(n).fill(0);
    
    // Подсчет вхождений
    for (let i = 0; i < n; i++) {
      count[arrayCopy[i] - min]++;
    }
    
    // Вычисление кумулятивной суммы
    for (let i = 1; i < range; i++) {
      count[i] += count[i - 1];
    }
    
    // Построение отсортированного массива
    for (let i = n - 1; i >= 0; i--) {
      animations.push({
        type: 'compare',
        indices: [i, count[arrayCopy[i] - min] - 1]
      });
      
      animations.push({
        type: 'replace',
        index: count[arrayCopy[i] - min] - 1,
        value: arrayCopy[i]
      });
      
      output[count[arrayCopy[i] - min] - 1] = arrayCopy[i];
      count[arrayCopy[i] - min]--;
    }
    
    // Копируем отсортированный массив обратно в исходный
    for (let i = 0; i < n; i++) {
      animations.push({
        type: 'replace',
        index: i,
        value: output[i]
      });
      
      arrayCopy[i] = output[i];
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };
  
  // БЛОЧНАЯ СОРТИРОВКА
  const bucketSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    // Находим максимальное и минимальное значение
    let min = arrayCopy[0];
    let max = arrayCopy[0];
    
    for (let i = 1; i < n; i++) {
      animations.push({
        type: 'compare',
        indices: [0, i]
      });
      
      if (arrayCopy[i] < min) min = arrayCopy[i];
      if (arrayCopy[i] > max) max = arrayCopy[i];
    }
    
    // Определяем количество блоков
    const bucketCount = Math.floor(Math.sqrt(n));
    const range = max - min;
    const buckets = Array.from({ length: bucketCount }, () => []);
    
    // Распределяем элементы по блокам
    for (let i = 0; i < n; i++) {
      const bucketIndex = Math.min(
        Math.floor(bucketCount * (arrayCopy[i] - min) / range),
        bucketCount - 1
      );
      
      animations.push({
        type: 'compare',
        indices: [i, i]
      });
      
      buckets[bucketIndex].push(arrayCopy[i]);
    }
    
    // Сортируем каждый блок и собираем обратно
    let currentIndex = 0;
    
    for (let i = 0; i < bucketCount; i++) {
      // Сортируем блок методом вставок
      buckets[i].sort((a, b) => a - b);
      
      // Собираем элементы обратно
      for (let j = 0; j < buckets[i].length; j++) {
        animations.push({
          type: 'replace',
          index: currentIndex,
          value: buckets[i][j]
        });
        
        arrayCopy[currentIndex++] = buckets[i][j];
      }
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };
  
  // ПОРАЗРЯДНАЯ СОРТИРОВКА
  const radixSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    // Находим максимальное значение
    let max = arrayCopy[0];
    for (let i = 1; i < n; i++) {
      animations.push({
        type: 'compare',
        indices: [0, i]
      });
      
      if (arrayCopy[i] > max) max = arrayCopy[i];
    }
    
    // Выполняем сортировку подсчетом для каждого разряда
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      const count = Array(10).fill(0);
      const output = Array(n).fill(0);
      
      // Подсчет количества элементов с определенной цифрой
      for (let i = 0; i < n; i++) {
        const digit = Math.floor(arrayCopy[i] / exp) % 10;
        count[digit]++;
      }
      
      // Вычисление кумулятивной суммы
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
      }
      
      // Построение отсортированного массива
      for (let i = n - 1; i >= 0; i--) {
        const digit = Math.floor(arrayCopy[i] / exp) % 10;
        
        animations.push({
          type: 'compare',
          indices: [i, count[digit] - 1]
        });
        
        animations.push({
          type: 'replace',
          index: count[digit] - 1,
          value: arrayCopy[i]
        });
        
        output[count[digit] - 1] = arrayCopy[i];
        count[digit]--;
      }
      
      // Копируем отсортированный массив обратно в исходный
      for (let i = 0; i < n; i++) {
        animations.push({
          type: 'replace',
          index: i,
          value: output[i]
        });
        
        arrayCopy[i] = output[i];
      }
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };
  
  // СОРТИРОВКА ШЕЛЛА
  const shellSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    
    // Последовательность промежутков Кнута
    let gap = 1;
    while (gap < n / 3) gap = 3 * gap + 1;
    
    while (gap >= 1) {
      // Сортировка вставками с увеличенным промежутком
      for (let i = gap; i < n; i++) {
        for (let j = i; j >= gap; j -= gap) {
          animations.push({
            type: 'compare',
            indices: [j, j - gap]
          });
          
          if (arrayCopy[j] < arrayCopy[j - gap]) {
            animations.push({
              type: 'swap',
              indices: [j, j - gap]
            });
            
            const temp = arrayCopy[j];
            arrayCopy[j] = arrayCopy[j - gap];
            arrayCopy[j - gap] = temp;
          } else {
            break;
          }
        }
      }
      
      // Уменьшаем промежуток
      gap = Math.floor(gap / 3);
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };
  
  // TIMSORT
  const timSort = () => {
    const arrayCopy = [...array];
    const animations = [];
    const n = arrayCopy.length;
    const RUN = 32; // Размер подмассива для сортировки вставками
    
    // Сортировка вставками для небольших подмассивов
    for (let i = 0; i < n; i += RUN) {
      const end = Math.min(i + RUN - 1, n - 1);
      insertionSortForRun(arrayCopy, i, end, animations);
    }
    
    // Слияние подмассивов
    for (let size = RUN; size < n; size = 2 * size) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);
        
        if (mid < right) {
          merge(arrayCopy, left, mid, right, animations);
        }
      }
    }
    
    // Воспроизведение анимаций
    animateSorting(animations, arrayCopy);
  };
  
  // Вспомогательная функция для Timsort - сортировка вставками для подмассива
  const insertionSortForRun = (arr, start, end, animations) => {
    for (let i = start + 1; i <= end; i++) {
      const key = arr[i];
      let j = i - 1;
      
      animations.push({
        type: 'compare',
        indices: [i, j]
      });
      
      while (j >= start && arr[j] > key) {
        animations.push({
          type: 'swap',
          indices: [j + 1, j]
        });
        
        arr[j + 1] = arr[j];
        j--;
        
        if (j >= start) {
          animations.push({
            type: 'compare',
            indices: [i, j]
          });
        }
      }
      
      arr[j + 1] = key;
    }
  };
  
  // Вспомогательная функция для Timsort - слияние подмассивов
  const merge = (arr, start, mid, end, animations) => {
    const left = arr.slice(start, mid + 1);
    const right = arr.slice(mid + 1, end + 1);
    
    let i = 0, j = 0, k = start;
    
    while (i < left.length && j < right.length) {
      animations.push({
        type: 'compare',
        indices: [start + i, mid + 1 + j]
      });
      
      if (left[i] <= right[j]) {
        animations.push({
          type: 'replace',
          index: k,
          value: left[i]
        });
        arr[k++] = left[i++];
      } else {
        animations.push({
          type: 'replace',
          index: k,
          value: right[j]
        });
        arr[k++] = right[j++];
      }
    }
    
    while (i < left.length) {
      animations.push({
        type: 'replace',
        index: k,
        value: left[i]
      });
      arr[k++] = left[i++];
    }
    
    while (j < right.length) {
      animations.push({
        type: 'replace',
        index: k,
        value: right[j]
      });
      arr[k++] = right[j++];
    }
  };

  // Функции сравнения алгоритмов без анимации
  
  // Пузырьковая сортировка для сравнения
  const bubbleSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        stats.comparisons++;
        
        if (arr[j] > arr[j + 1]) {
          stats.swaps++;
          
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
        }
      }
    }
    
    return arr;
  };
  
  // Сортировка выбором для сравнения
  const selectionSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      
      for (let j = i + 1; j < n; j++) {
        stats.comparisons++;
        
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        stats.swaps++;
        
        const temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
      }
    }
    
    return arr;
  };
  
  // Сортировка вставками для сравнения
  const insertionSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;
      
      while (j >= 0) {
        stats.comparisons++;
        
        if (arr[j] > key) {
          stats.swaps++;
          
          arr[j + 1] = arr[j];
          j--;
        } else {
          break;
        }
      }
      
      arr[j + 1] = key;
    }
    
    return arr;
  };
  
  // Сортировка слиянием для сравнения
  const mergeSortForCompare = (arr, stats) => {
    const mergeSortHelper = (arr, start, end) => {
      if (start >= end) return;
      
      const mid = Math.floor((start + end) / 2);
      mergeSortHelper(arr, start, mid);
      mergeSortHelper(arr, mid + 1, end);
      mergeForCompare(arr, start, mid, end, stats);
    };
    
    mergeSortHelper(arr, 0, arr.length - 1);
    
    return arr;
  };
  
  const mergeForCompare = (arr, start, mid, end, stats) => {
    const left = arr.slice(start, mid + 1);
    const right = arr.slice(mid + 1, end + 1);
    
    let i = 0, j = 0, k = start;
    
    while (i < left.length && j < right.length) {
      stats.comparisons++;
      
      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
      
      stats.swaps++;
    }
    
    while (i < left.length) {
      arr[k++] = left[i++];
      stats.swaps++;
    }
    
    while (j < right.length) {
      arr[k++] = right[j++];
      stats.swaps++;
    }
  };
  
  // Быстрая сортировка для сравнения
  const quickSortForCompare = (arr, stats) => {
    const quickSortHelper = (arr, low, high) => {
      if (low < high) {
        const pivotIndex = partitionForCompare(arr, low, high, stats);
        quickSortHelper(arr, low, pivotIndex - 1);
        quickSortHelper(arr, pivotIndex + 1, high);
      }
    };
    
    quickSortHelper(arr, 0, arr.length - 1);
    
    return arr;
  };
  
  const partitionForCompare = (arr, low, high, stats) => {
    const pivot = arr[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
      stats.comparisons++;
      
      if (arr[j] < pivot) {
        i++;
        
        stats.swaps++;
        
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
    }
    
    stats.swaps++;
    
    const temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    
    return i + 1;
  };
  
  // Пирамидальная сортировка для сравнения
  const heapSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    // Построение максимальной кучи
    const buildMaxHeap = () => {
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapifyForCompare(arr, i, n, stats);
      }
    };
    
    buildMaxHeap();
    
    for (let i = n - 1; i > 0; i--) {
      stats.swaps++;
      
      const temp = arr[0];
      arr[0] = arr[i];
      arr[i] = temp;
      
      heapifyForCompare(arr, 0, i, stats);
    }
    
    return arr;
  };
  
  const heapifyForCompare = (arr, i, heapSize, stats) => {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    let largest = i;
    
    if (left < heapSize) {
      stats.comparisons++;
      
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }
    
    if (right < heapSize) {
      stats.comparisons++;
      
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }
    
    if (largest !== i) {
      stats.swaps++;
      
      const temp = arr[i];
      arr[i] = arr[largest];
      arr[largest] = temp;
      
      heapifyForCompare(arr, largest, heapSize, stats);
    }
  };
  
  // Сортировка подсчетом для сравнения
  const countingSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    let min = arr[0];
    let max = arr[0];
    
    for (let i = 1; i < n; i++) {
      stats.comparisons += 2;
      
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    
    const range = max - min + 1;
    const count = Array(range).fill(0);
    const output = Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      count[arr[i] - min]++;
    }
    
    for (let i = 1; i < range; i++) {
      count[i] += count[i - 1];
    }
    
    for (let i = n - 1; i >= 0; i--) {
      stats.comparisons++;
      stats.swaps++;
      
      output[count[arr[i] - min] - 1] = arr[i];
      count[arr[i] - min]--;
    }
    
    for (let i = 0; i < n; i++) {
      stats.swaps++;
      
      arr[i] = output[i];
    }
    
    return arr;
  };
  
  // Блочная сортировка для сравнения
  const bucketSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    let min = arr[0];
    let max = arr[0];
    
    for (let i = 1; i < n; i++) {
      stats.comparisons += 2;
      
      if (arr[i] < min) min = arr[i];
      if (arr[i] > max) max = arr[i];
    }
    
    const bucketCount = Math.floor(Math.sqrt(n));
    const range = max - min;
    const buckets = Array.from({ length: bucketCount }, () => []);
    
    for (let i = 0; i < n; i++) {
      stats.comparisons++;
      
      const bucketIndex = Math.min(
        Math.floor(bucketCount * (arr[i] - min) / range),
        bucketCount - 1
      );
      
      buckets[bucketIndex].push(arr[i]);
    }
    
    let currentIndex = 0;
    
    for (let i = 0; i < bucketCount; i++) {
      // Сортировка блока
      buckets[i].sort((a, b) => {
        stats.comparisons++;
        if (a !== b) stats.swaps++;
        return a - b;
      });
      
      for (let j = 0; j < buckets[i].length; j++) {
        stats.swaps++;
        
        arr[currentIndex++] = buckets[i][j];
      }
    }
    
    return arr;
  };
  
  // Поразрядная сортировка для сравнения
  const radixSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    let max = arr[0];
    for (let i = 1; i < n; i++) {
      stats.comparisons++;
      
      if (arr[i] > max) max = arr[i];
    }
    
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      const count = Array(10).fill(0);
      const output = Array(n).fill(0);
      
      for (let i = 0; i < n; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        count[digit]++;
      }
      
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
      }
      
      for (let i = n - 1; i >= 0; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        
        stats.comparisons++;
        stats.swaps++;
        
        output[count[digit] - 1] = arr[i];
        count[digit]--;
      }
      
      for (let i = 0; i < n; i++) {
        stats.swaps++;
        
        arr[i] = output[i];
      }
    }
    
    return arr;
  };
  
  // Сортировка Шелла для сравнения
  const shellSortForCompare = (arr, stats) => {
    const n = arr.length;
    
    let gap = 1;
    while (gap < n / 3) gap = 3 * gap + 1;
    
    while (gap >= 1) {
      for (let i = gap; i < n; i++) {
        for (let j = i; j >= gap; j -= gap) {
          stats.comparisons++;
          
          if (arr[j] < arr[j - gap]) {
            stats.swaps++;
            
            const temp = arr[j];
            arr[j] = arr[j - gap];
            arr[j - gap] = temp;
          } else {
            break;
          }
        }
      }
      
      gap = Math.floor(gap / 3);
    }
    
    return arr;
  };
  
  // Timsort для сравнения
  const timSortForCompare = (arr, stats) => {
    const n = arr.length;
    const RUN = 32;
    
    for (let i = 0; i < n; i += RUN) {
      const end = Math.min(i + RUN - 1, n - 1);
      insertionSortForRunCompare(arr, i, end, stats);
    }
    
    for (let size = RUN; size < n; size = 2 * size) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = left + size - 1;
        const right = Math.min(left + 2 * size - 1, n - 1);
        
        if (mid < right) {
          mergeForCompare(arr, left, mid, right, stats);
        }
      }
    }
    
    return arr;
  };
  
  const insertionSortForRunCompare = (arr, start, end, stats) => {
    for (let i = start + 1; i <= end; i++) {
      const key = arr[i];
      let j = i - 1;
      
      stats.comparisons++;
      
      while (j >= start && arr[j] > key) {
        stats.swaps++;
        
        arr[j + 1] = arr[j];
        j--;
        
        if (j >= start) {
          stats.comparisons++;
        }
      }
      
      arr[j + 1] = key;
    }
  };

  // Функция анимации сортировки
  const animateSorting = (animations, sortedArray) => {
    if (isStepMode) {
      // В пошаговом режиме сохраняем анимации и не запускаем автоматическое воспроизведение
      setAnimationHistory(animations);
      setCurrentStep(0);
      return;
    }
    
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current = [];
    
    animations.forEach((animation, index) => {
      const timeout = setTimeout(() => {
        if (animation.type === 'compare') {
          setCurrentCompare(animation.indices);
          addComparison();
        } else if (animation.type === 'swap') {
          setCurrentSwap(animation.indices);
          addSwap();
          
          // Обновление массива после перестановки
          setArray(prevArray => {
            const newArray = [...prevArray];
            const [i, j] = animation.indices;
            const temp = newArray[i];
            newArray[i] = newArray[j];
            newArray[j] = temp;
            return newArray;
          });
        } else if (animation.type === 'replace') {
          // Обновление массива при замене значения (для сортировки слиянием)
          setArray(prevArray => {
            const newArray = [...prevArray];
            newArray[animation.index] = animation.value;
            return newArray;
          });
        }
        
        // Если это последняя анимация, завершаем сортировку
        if (index === animations.length - 1) {
          setTimeout(() => {
            setCurrentCompare([-1, -1]);
            setCurrentSwap([-1, -1]);
            setIsSorting(false);
            setIsSorted(true);
            // Проверка результата сортировки
            setArray(sortedArray);
          }, 300);
        }
      }, index * (101 - sortingSpeed));
      
      timeouts.current.push(timeout);
    });
  };

  // Определение цвета столбца
  const getBarColor = (index) => {
    // Если сортировка завершена, все столбцы зеленые
    if (isSorted) return isDarkMode ? 'bg-green-400' : 'bg-emerald-500';
    
    // Если элемент сравнивается
    if (currentCompare.includes(index)) return 'bg-yellow-500';
    
    // Если элемент меняется местами
    if (currentSwap.includes(index)) return 'bg-red-500';
    
    // Обычный цвет
    return isDarkMode ? 'bg-green-600' : 'bg-emerald-400';
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-emerald-50 text-gray-800'}`}>
      {/* Заголовок */}
      <header className={`${isDarkMode ? 'bg-green-800' : 'bg-emerald-600'} text-white p-4 shadow-md`}>
        <h1 className="text-3xl font-bold text-center">Визуализатор алгоритмов сортировки</h1>
      </header>
      
      {/* Основное содержимое */}
      <main className="flex-grow p-4">
        {/* Панель управления */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Выбор алгоритма */}
            <div>
              <label className="block text-sm font-medium mb-2">Алгоритм сортировки:</label>
              <select 
                className={`w-full p-2 border ${isDarkMode ? 'border-green-700 bg-gray-700' : 'border-emerald-300 bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                value={selectedAlgorithm}
                onChange={handleAlgorithmChange}
                disabled={isSorting}
              >
                {Object.entries(ALGORITHMS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            
            {/* Размер массива */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Размер массива: {arraySize}
              </label>
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={arraySize} 
                onChange={handleSizeChange}
                disabled={isSorting}
                className={`w-full h-2 ${isDarkMode ? 'bg-green-900' : 'bg-emerald-200'} rounded-lg appearance-none cursor-pointer accent-emerald-600`}
              />
            </div>
            
            {/* Скорость сортировки */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Скорость: {sortingSpeed}%
              </label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={sortingSpeed} 
                onChange={handleSpeedChange}
                disabled={isSorting}
                className={`w-full h-2 ${isDarkMode ? 'bg-green-900' : 'bg-emerald-200'} rounded-lg appearance-none cursor-pointer accent-emerald-600`}
              />
            </div>
          </div>
          
          {/* Предустановленные наборы данных */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Предустановленные наборы данных:</label>
            <select 
              className={`w-full p-2 border ${isDarkMode ? 'border-green-700 bg-gray-700' : 'border-emerald-300 bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              value={selectedPreset}
              onChange={handlePresetChange}
              disabled={isSorting}
            >
              {Object.entries(PRESET_DATA).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          
          {/* Ручной ввод данных */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Ручной ввод массива (числа через запятую):</label>
            <div className="flex">
              <input 
                type="text" 
                className={`flex-grow p-2 border ${isDarkMode ? 'border-green-700 bg-gray-700' : 'border-emerald-300 bg-white'} rounded-l focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                value={userInput}
                onChange={handleUserInputChange}
                placeholder="Например: 5, 3, 8, 1, 9, 4, 7"
                disabled={isSorting}
              />
              <button 
                className={`px-4 py-2 ${isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-r transition disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={applyUserInput}
                disabled={isSorting || !userInput.trim()}
              >
                Применить
              </button>
            </div>
          </div>
          
          {/* Загрузка файла */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Загрузка массива из файла (CSV, JSON):</label>
            <input 
              type="file" 
              accept=".csv,.json" 
              onChange={handleFileUpload}
              disabled={isSorting}
              className={`w-full p-2 border ${isDarkMode ? 'border-green-700 bg-gray-700' : 'border-emerald-300 bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
          
          {/* Масштаб визуализации */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Масштаб визуализации: {zoom}%
            </label>
            <input 
              type="range" 
              min="50" 
              max="200" 
              value={zoom} 
              onChange={handleZoomChange}
              className={`w-full h-2 ${isDarkMode ? 'bg-green-900' : 'bg-emerald-200'} rounded-lg appearance-none cursor-pointer accent-emerald-600`}
            />
          </div>
          
          {/* Тип отображения */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Тип отображения:</label>
            <select 
              className={`w-full p-2 border ${isDarkMode ? 'border-green-700 bg-gray-700' : 'border-emerald-300 bg-white'} rounded focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              value={displayType}
              onChange={handleDisplayTypeChange}
              disabled={isSorting}
            >
              {Object.entries(DISPLAY_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          
          {/* Переключатель темной темы */}
          <div className="flex items-center mt-4">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                value="" 
                className="sr-only peer" 
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <div className={`relative w-11 h-6 ${isDarkMode ? 'bg-green-700' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              <span className="ml-3 text-sm font-medium">Темная тема</span>
            </label>
          </div>
          
          {/* Пошаговый режим */}
          <div className="flex items-center mt-4">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                value="" 
                className="sr-only peer" 
                checked={isStepMode}
                onChange={toggleStepMode}
                disabled={isSorting}
              />
              <div className={`relative w-11 h-6 ${isStepMode ? 'bg-emerald-600' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              <span className="ml-3 text-sm font-medium">Пошаговый режим</span>
            </label>
          </div>
          
          {/* Сравнение алгоритмов */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Сравнение алгоритмов:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(ALGORITHMS).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`compare-${key}`}
                    value={key}
                    checked={algorithmsToCompare.includes(key)}
                    onChange={handleCompareAlgorithmChange}
                    disabled={isSorting}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor={`compare-${key}`} className="ml-2 text-sm">{value}</label>
                </div>
              ))}
            </div>
            <button 
              className={`mt-2 px-4 py-2 ${isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={startComparing}
              disabled={isSorting || algorithmsToCompare.length === 0}
            >
              Сравнить выбранные алгоритмы
            </button>
          </div>
          
          {/* Кнопки управления */}
          <div className="flex flex-wrap justify-center mt-4 gap-2">
            <button 
              className={`px-6 py-2 ${isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={resetArray}
              disabled={isSorting}
            >
              Новый массив
            </button>
            
            <button 
              className={`px-6 py-2 ${isDarkMode ? 'bg-green-800 hover:bg-green-900' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={startSorting}
              disabled={isSorting || isSorted}
            >
              {isSorted ? 'Отсортировано' : 'Начать сортировку'}
            </button>
            
            <button 
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={pauseSorting}
              disabled={!isSorting || isSorted}
            >
              Прервать сортировку
            </button>
            
            {/* Кнопки пошагового режима */}
            {isStepMode && (
              <>
                <button 
                  className={`px-6 py-2 ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={stepBackward}
                  disabled={isSorting || currentStep <= 0}
                >
                  Шаг назад
                </button>
                
                <button 
                  className={`px-6 py-2 ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={stepForward}
                  disabled={isSorting || currentStep >= animationHistory.length - 1 || isSorted}
                >
                  Шаг вперед
                </button>
              </>
            )}
          </div>
          
          {/* Кнопки экспорта статистики */}
          <div className="flex justify-center mt-4 space-x-4">
            <button 
              className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={exportStatsToJSON}
              disabled={!isSorted && !isPaused}
            >
              Экспорт в JSON
            </button>
            
            <button 
              className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={exportStatsToCSV}
              disabled={!isSorted && !isPaused}
            >
              Экспорт в CSV
            </button>
          </div>
        </div>
        
        {/* Блок статистики */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <h2 className="text-xl font-semibold mb-2">Статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`text-center p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-emerald-100'} rounded`}>
              <p className="text-sm">Сравнения</p>
              <p className="text-2xl font-bold">{stats.comparisons}</p>
            </div>
            <div className={`text-center p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-emerald-100'} rounded`}>
              <p className="text-sm">Перестановки</p>
              <p className="text-2xl font-bold">{stats.swaps}</p>
            </div>
            <div className={`text-center p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-emerald-100'} rounded`}>
              <p className="text-sm">Время (сек)</p>
              <p className="text-2xl font-bold">{stats.time}</p>
            </div>
            <div className={`text-center p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-emerald-100'} rounded`}>
              <p className="text-sm">Шаг (пошаговый режим)</p>
              <p className="text-2xl font-bold">{currentStep}/{animationHistory.length}</p>
            </div>
          </div>
          
          {/* Результаты сравнения алгоритмов */}
          {compareResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Результаты сравнения алгоритмов</h3>
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <thead>
                    <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-emerald-100'}`}>
                      <th className="px-4 py-2 text-left">Алгоритм</th>
                      <th className="px-4 py-2 text-right">Сравнения</th>
                      <th className="px-4 py-2 text-right">Перестановки</th>
                      <th className="px-4 py-2 text-right">Время (сек)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareResults.map((result, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}`}>
                        <td className="px-4 py-2">{result.algorithmName}</td>
                        <td className="px-4 py-2 text-right">{result.comparisons}</td>
                        <td className="px-4 py-2 text-right">{result.swaps}</td>
                        <td className="px-4 py-2 text-right">{result.executionTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* График сравнения алгоритмов */}
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={compareResults.map(result => ({
                      name: result.algorithm,
                      comparisons: result.comparisons,
                      swaps: result.swaps,
                      time: parseFloat(result.executionTime) * 1000 // Перевод в миллисекунды для лучшей визуализации
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={isDarkMode ? '#d1d5db' : '#374151'} />
                    <YAxis stroke={isDarkMode ? '#d1d5db' : '#374151'} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }} />
                    <Legend />
                    <Line type="monotone" dataKey="comparisons" name="Сравнения" stroke="#10b981" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="swaps" name="Перестановки" stroke="#f59e0b" />
                    <Line type="monotone" dataKey="time" name="Время (мс)" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        
        {/* Описание алгоритма */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <h2 className="text-xl font-semibold mb-2">{ALGORITHMS[selectedAlgorithm]}</h2>
          <p>{ALGORITHM_DESCRIPTIONS[selectedAlgorithm]}</p>
        </div>
        
        {/* Легенда цветов */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <h2 className="text-xl font-semibold mb-2">Обозначения цветов</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${isDarkMode ? 'bg-green-600' : 'bg-emerald-400'} rounded mr-2`}></div>
              <span>Стандартный элемент</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded mr-2"></div>
              <span>Элементы, которые сравниваются</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500 rounded mr-2"></div>
              <span>Элементы, которые меняются местами</span>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 ${isDarkMode ? 'bg-green-400' : 'bg-emerald-500'} rounded mr-2`}></div>
              <span>Отсортированные элементы</span>
            </div>
          </div>
          <div className={`mt-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className="font-medium mb-1">Как читать визуализацию:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Во время сортировки алгоритм анализирует и сравнивает значения элементов (желтый цвет)</li>
              <li>При необходимости алгоритм меняет элементы местами (красный цвет)</li>
              <li>Когда весь массив отсортирован, все элементы отмечаются зеленым цветом</li>
              <li>Высота столбца или числовое значение соответствует величине элемента</li>
            </ul>
          </div>
        </div>
        
        {/* Визуализация массива */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 h-64 relative`} style={{ height: `${Math.max(64, zoom * 0.8)}px` }}>
          {displayType === 'BARS' && (
            /* Отображение в виде столбцов */
            <div className="flex items-end justify-center h-full">
              {array.map((value, index) => (
                <div
                  key={index}
                  className={`w-1 mx-1 ${getBarColor(index)} transition-all duration-100`}
                  style={{ height: `${value * zoom / 100}%` }}
                ></div>
              ))}
            </div>
          )}
          
          {displayType === 'NUMBERS' && (
            /* Отображение в виде числовых значений */
            <div className="h-full overflow-auto p-2">
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {array.map((value, index) => (
                  <div
                    key={index}
                    className={`p-2 text-center rounded ${getBarColor(index)} transition-all duration-100`}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {displayType === 'CIRCLE' && (
            /* Отображение в виде круговой диаграммы */
            <div className="flex items-center justify-center h-full">
              <div className="relative" style={{ width: `${zoom}%`, height: `${zoom}%`, maxWidth: '100%', maxHeight: '100%' }}>
                {array.map((value, index) => {
                  const angle = (index / array.length) * 2 * Math.PI;
                  const radius = Math.min(200, zoom * 1.5) / 2;
                  const itemRadius = Math.max(2, (value / 100) * 20);
                  const x = radius * Math.cos(angle) + radius;
                  const y = radius * Math.sin(angle) + radius;
                  
                  return (
                    <div
                      key={index}
                      className={`absolute rounded-full ${getBarColor(index)} transition-all duration-300`}
                      style={{
                        width: `${itemRadius}px`,
                        height: `${itemRadius}px`,
                        transform: `translate(${x}px, ${y}px)`,
                        left: '-5px',
                        top: '-5px'
                      }}
                    ></div>
                  );
                })}
              </div>
            </div>
          )}
          
          {displayType === 'HISTOGRAM' && (
            /* Отображение в виде гистограммы */
            <div className="h-full flex items-end">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={array.map((value, index) => ({ index, value }))}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="index" stroke={isDarkMode ? '#d1d5db' : '#374151'} />
                  <YAxis domain={[0, 100]} stroke={isDarkMode ? '#d1d5db' : '#374151'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      borderColor: isDarkMode ? '#374151' : '#e5e7eb'
                    }}
                    formatter={(value) => [`Значение: ${value}`, 'Элемент']}
                    labelFormatter={(index) => `Индекс: ${index}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isDarkMode ? '#10b981' : '#059669'}
                    dot={({ cx, cy, index }) => (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill={
                          currentCompare.includes(index) 
                            ? '#f59e0b' 
                            : currentSwap.includes(index) 
                            ? '#ef4444' 
                            : isSorted 
                            ? (isDarkMode ? '#34d399' : '#10b981')
                            : (isDarkMode ? '#059669' : '#34d399')
                        } 
                      />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Индикатор загрузки при сортировке */}
          {isSorting && (
            <div className="absolute top-2 right-2">
              <div className={`w-6 h-6 border-4 ${isDarkMode ? 'border-green-500' : 'border-emerald-500'} border-t-transparent rounded-full animate-spin`}></div>
            </div>
          )}
          
          {/* Индикатор приостановки */}
          {isPaused && (
            <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded">
              Приостановлено
            </div>
          )}
        </div>
      </main>
      
      {/* Подвал */}
      <footer className={`${isDarkMode ? 'bg-green-800' : 'bg-emerald-600'} text-white p-4 text-center`}>
        <p>© 2025 Визуализатор алгоритмов сортировки</p>
      </footer>
      
      {/* Стили для темной темы */}
      <style jsx="true">{`
        .dark-mode {
          background-color: #111827;
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default SortingVisualizer;