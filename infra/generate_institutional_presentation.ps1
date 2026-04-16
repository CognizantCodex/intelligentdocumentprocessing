param(
  [string]$OutputPath = "C:\Users\456989\OneDrive - Cognizant\Documents\New project\Enterprise-IDP-Studio-Institutional-Deck.pptx"
)

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$presentation = $ppt.Presentations.Add()

$layoutTitle = 1
$layoutTitleAndContent = 2
$msoTrue = -1
$msoFalse = 0
$ppAlignCenter = 2

$colors = @{
  Navy = 0x23180F
  Blue = 0xE45B25
  Sky = 0xFFDFA8
  White = 0xFFFFFF
  Charcoal = 0x2B2B2B
  Slate = 0x6B7280
  Light = 0xF6F8FC
}

function Set-TextStyle {
  param(
    $TextRange,
    [int]$Size,
    [int]$Color,
    [string]$Font = "Aptos",
    [int]$Bold = 0
  )
  $TextRange.Font.Name = $Font
  $TextRange.Font.Size = $Size
  $TextRange.Font.Bold = $Bold
  $TextRange.Font.Color.RGB = $Color
}

function Add-Background {
  param($Slide, [int]$Color)
  $shape = $Slide.Shapes.AddShape(1, 0, 0, 960, 540)
  $shape.Fill.ForeColor.RGB = $Color
  $shape.Line.Visible = $msoFalse
  $shape.ZOrder(1) | Out-Null
}

function Add-HeaderBar {
  param($Slide, [string]$LeftTag)
  $bar = $Slide.Shapes.AddShape(1, 0, 0, 960, 34)
  $bar.Fill.ForeColor.RGB = $colors.Blue
  $bar.Line.Visible = $msoFalse
  $tag = $Slide.Shapes.AddTextbox(1, 28, 6, 420, 24)
  $tag.TextFrame.TextRange.Text = $LeftTag
  Set-TextStyle -TextRange $tag.TextFrame.TextRange -Size 14 -Color $colors.White -Font "Aptos" -Bold $msoTrue
}

function Add-Footer {
  param($Slide, [string]$Text = "Enterprise IDP Studio | Intelligent Document Processing Platform")
  $footer = $Slide.Shapes.AddTextbox(1, 28, 505, 900, 18)
  $footer.TextFrame.TextRange.Text = $Text
  Set-TextStyle -TextRange $footer.TextFrame.TextRange -Size 10 -Color $colors.Slate -Font "Aptos"
}

function Add-TitleSlide {
  param([string]$Title, [string]$Subtitle)
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $layoutTitle)
  Add-Background -Slide $slide -Color $colors.Navy

  $accent = $slide.Shapes.AddShape(1, 48, 44, 118, 38)
  $accent.Fill.ForeColor.RGB = $colors.Sky
  $accent.Line.Visible = $msoFalse
  $accent.TextFrame.TextRange.Text = "Institution-Grade Deck"
  $accent.TextFrame.TextRange.ParagraphFormat.Alignment = $ppAlignCenter
  Set-TextStyle -TextRange $accent.TextFrame.TextRange -Size 14 -Color $colors.Blue -Font "Aptos" -Bold $msoTrue

  $slide.Shapes.Title.Left = 52
  $slide.Shapes.Title.Top = 120
  $slide.Shapes.Title.Width = 820
  $slide.Shapes.Title.Height = 120
  $slide.Shapes.Title.TextFrame.TextRange.Text = $Title
  Set-TextStyle -TextRange $slide.Shapes.Title.TextFrame.TextRange -Size 28 -Color $colors.White -Font "Aptos Display" -Bold $msoTrue

  $subtitleShape = $slide.Shapes.Item(2)
  $subtitleShape.Left = 56
  $subtitleShape.Top = 250
  $subtitleShape.Width = 780
  $subtitleShape.Height = 120
  $subtitleShape.TextFrame.TextRange.Text = $Subtitle
  Set-TextStyle -TextRange $subtitleShape.TextFrame.TextRange -Size 18 -Color $colors.Light -Font "Aptos"

  $panel = $slide.Shapes.AddShape(1, 54, 395, 840, 82)
  $panel.Fill.ForeColor.RGB = 0x2A2234
  $panel.Line.Visible = $msoFalse
  $panel.TextFrame.TextRange.Text = "Core message: Enterprise IDP Studio converts unstructured business documents into grounded, validated, routed, and reviewable operational data with measurable demo accuracy."
  Set-TextStyle -TextRange $panel.TextFrame.TextRange -Size 18 -Color $colors.White -Font "Aptos" -Bold $msoTrue

  Add-Footer -Slide $slide -Text "Prepared for evaluation across Codex integration, partner impact, reusability, and demo quality"
}

function Add-BulletSlide {
  param(
    [string]$Header,
    [string]$Title,
    [string[]]$Bullets,
    [string]$RightNote = ""
  )

  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $layoutTitleAndContent)
  Add-Background -Slide $slide -Color $colors.White
  Add-HeaderBar -Slide $slide -LeftTag $Header
  Add-Footer -Slide $slide

  $slide.Shapes.Title.Left = 28
  $slide.Shapes.Title.Top = 52
  $slide.Shapes.Title.Width = 700
  $slide.Shapes.Title.Height = 60
  $slide.Shapes.Title.TextFrame.TextRange.Text = $Title
  Set-TextStyle -TextRange $slide.Shapes.Title.TextFrame.TextRange -Size 24 -Color $colors.Charcoal -Font "Aptos Display" -Bold $msoTrue

  $body = $slide.Shapes.Item(2)
  $body.Left = 36
  $body.Top = 124
  $body.Width = 570
  $body.Height = 330
  $body.TextFrame.TextRange.Text = ($Bullets -join "`r")
  Set-TextStyle -TextRange $body.TextFrame.TextRange -Size 20 -Color $colors.Charcoal -Font "Aptos"

  if ($RightNote -ne "") {
    $panel = $slide.Shapes.AddShape(1, 642, 128, 280, 282)
    $panel.Fill.ForeColor.RGB = $colors.Light
    $panel.Line.ForeColor.RGB = $colors.Sky
    $panel.TextFrame.TextRange.Text = $RightNote
    Set-TextStyle -TextRange $panel.TextFrame.TextRange -Size 17 -Color $colors.Charcoal -Font "Aptos"
  }
}

function Add-RubricSlide {
  $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, $layoutTitleAndContent)
  Add-Background -Slide $slide -Color $colors.White
  Add-HeaderBar -Slide $slide -LeftTag "Evaluation Rubric"
  Add-Footer -Slide $slide

  $slide.Shapes.Title.Left = 28
  $slide.Shapes.Title.Top = 52
  $slide.Shapes.Title.Width = 760
  $slide.Shapes.Title.TextFrame.TextRange.Text = "Presentation aligned to the judging criteria shown in the evaluation image"
  Set-TextStyle -TextRange $slide.Shapes.Title.TextFrame.TextRange -Size 24 -Color $colors.Charcoal -Font "Aptos Display" -Bold $msoTrue
}

Add-TitleSlide `
  "Enterprise IDP Studio" `
  "An institutional-grade Intelligent Document Processing platform for grounded extraction, validation, routing, review, and measurable document-operations outcomes"

Add-RubricSlide

$presentation.SaveAs($OutputPath, 24)
$presentation.Close()
$ppt.Quit()
